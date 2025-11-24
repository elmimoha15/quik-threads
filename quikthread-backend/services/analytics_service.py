import tweepy
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from config.firebase import db
from config.settings import settings
from models.analytics import AnalyticsData, EngagementPoint, TopPost
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for fetching and aggregating X post analytics"""
    
    def __init__(self):
        """Initialize Twitter API v2 client for analytics"""
        self.api_key = settings.twitter_api_key
        self.api_secret = settings.twitter_api_secret
        self.access_token = settings.twitter_access_token
        self.access_secret = settings.twitter_access_secret
        
        # Initialize client if credentials are available
        self.client = None
        if all([self.api_key, self.api_secret, self.access_token, self.access_secret]):
            try:
                self.client = tweepy.Client(
                    consumer_key=self.api_key,
                    consumer_secret=self.api_secret,
                    access_token=self.access_token,
                    access_token_secret=self.access_secret
                )
                logger.info("Analytics Twitter API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize analytics Twitter client: {str(e)}")
        else:
            logger.warning("Twitter API credentials not configured for analytics")
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Get analytics for a user's posts
        
        Fetches all posts from Firestore, retrieves metrics from Twitter API,
        and calculates aggregated analytics.
        
        Args:
            user_id: User ID to get analytics for
            
        Returns:
            Analytics data dictionary
        """
        try:
            # Query user's posts from Firestore
            posts_query = (
                db.collection('posts')
                .where('userId', '==', user_id)
                .order_by('postedAt', direction='DESCENDING')
                .limit(100)  # Last 100 posts
            )
            
            posts = []
            for doc in posts_query.stream():
                post_data = doc.to_dict()
                posts.append(post_data)
            
            if not posts:
                # No posts yet, return empty analytics
                return self._empty_analytics()
            
            # Calculate date ranges
            now = datetime.utcnow()
            week_ago = now - timedelta(days=7)
            two_weeks_ago = now - timedelta(days=14)
            
            # Initialize metrics
            total_impressions = 0
            total_likes = 0
            total_retweets = 0
            total_replies = 0
            total_bookmarks = 0
            posts_this_week = 0
            posts_last_week = 0
            
            # Track daily engagement for trend
            daily_engagement = {}
            for i in range(7):
                date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
                daily_engagement[date] = 0
            
            # Track top posts
            post_engagements = []
            
            # Fetch metrics for each post
            for post in posts:
                posted_at = post.get('postedAt')
                if hasattr(posted_at, 'timestamp'):
                    posted_at = datetime.fromtimestamp(posted_at.timestamp())
                
                # Count posts this week vs last week
                if posted_at >= week_ago:
                    posts_this_week += 1
                elif posted_at >= two_weeks_ago:
                    posts_last_week += 1
                
                # Get tweet IDs
                tweet_ids = post.get('tweetIds', [])
                
                if not tweet_ids or not self.client:
                    # No tweet IDs or Twitter client not configured
                    # Use mock data for demonstration
                    engagement = 0
                else:
                    # Fetch metrics from Twitter API
                    try:
                        # Get metrics for first tweet in thread (main tweet)
                        tweet_id = tweet_ids[0]
                        tweet = self.client.get_tweet(
                            tweet_id,
                            tweet_fields=['public_metrics']
                        )
                        
                        if tweet.data:
                            metrics = tweet.data.public_metrics
                            impressions = metrics.get('impression_count', 0)
                            likes = metrics.get('like_count', 0)
                            retweets = metrics.get('retweet_count', 0)
                            replies = metrics.get('reply_count', 0)
                            bookmarks = metrics.get('bookmark_count', 0)
                            
                            total_impressions += impressions
                            total_likes += likes
                            total_retweets += retweets
                            total_replies += replies
                            total_bookmarks += bookmarks
                            
                            engagement = likes + retweets + replies + bookmarks
                        else:
                            engagement = 0
                            
                    except Exception as e:
                        logger.warning(f"Failed to fetch metrics for tweet {tweet_id}: {str(e)}")
                        engagement = 0
                
                # Add to daily engagement if within last 7 days
                if posted_at >= week_ago:
                    date_str = posted_at.strftime('%Y-%m-%d')
                    if date_str in daily_engagement:
                        daily_engagement[date_str] += engagement
                
                # Track for top posts
                post_engagements.append({
                    'threadUrl': post.get('threadUrl', ''),
                    'engagement': engagement,
                    'postedAt': posted_at,
                    'tweetIds': tweet_ids
                })
            
            # Calculate total engagements
            total_engagements = total_likes + total_retweets + total_replies + total_bookmarks
            
            # Calculate reach (estimated unique views, typically 70% of impressions)
            total_reach = int(total_impressions * 0.7)
            
            # Calculate week-over-week growth
            if posts_last_week > 0:
                week_over_week_growth = ((posts_this_week - posts_last_week) / posts_last_week) * 100
            else:
                week_over_week_growth = 0.0 if posts_this_week == 0 else 100.0
            
            # Build engagement trend
            engagement_trend = [
                EngagementPoint(date=date, engagements=daily_engagement[date])
                for date in sorted(daily_engagement.keys())
            ]
            
            # Get top 5 posts by engagement
            top_posts_data = sorted(post_engagements, key=lambda x: x['engagement'], reverse=True)[:5]
            top_posts = []
            
            for post_data in top_posts_data:
                # Get first tweet text as title
                title = "Thread"
                if post_data['tweetIds'] and self.client:
                    try:
                        tweet = self.client.get_tweet(post_data['tweetIds'][0])
                        if tweet.data:
                            title = tweet.data.text[:50] + "..." if len(tweet.data.text) > 50 else tweet.data.text
                    except Exception as e:
                        logger.warning(f"Failed to fetch tweet text: {str(e)}")
                
                top_posts.append(TopPost(
                    title=title,
                    engagement=post_data['engagement'],
                    threadUrl=post_data['threadUrl'],
                    postedAt=post_data['postedAt']
                ))
            
            # Build analytics data
            analytics_data = AnalyticsData(
                totalImpressions=total_impressions,
                totalReach=total_reach,
                totalLikes=total_likes,
                totalEngagements=total_engagements,
                weekOverWeekGrowth=round(week_over_week_growth, 2),
                postsThisWeek=posts_this_week,
                engagementTrend=engagement_trend,
                topPosts=top_posts,
                lastUpdated=datetime.utcnow()
            )
            
            logger.info(f"Generated analytics for user {user_id}: {posts_this_week} posts this week")
            
            return analytics_data.dict()
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            return self._empty_analytics()
    
    def _empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics data"""
        return AnalyticsData(
            totalImpressions=0,
            totalReach=0,
            totalLikes=0,
            totalEngagements=0,
            weekOverWeekGrowth=0.0,
            postsThisWeek=0,
            engagementTrend=[],
            topPosts=[],
            lastUpdated=datetime.utcnow()
        ).dict()
    
    async def cache_analytics(self, user_id: str, analytics_data: Dict[str, Any]) -> None:
        """
        Cache analytics data in Firestore
        
        Args:
            user_id: User ID
            analytics_data: Analytics data to cache
        """
        try:
            cache_data = {
                **analytics_data,
                'cachedAt': datetime.utcnow()
            }
            
            db.collection('analytics-cache').document(user_id).set(cache_data)
            logger.info(f"Cached analytics for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error caching analytics: {str(e)}")
            # Don't raise - caching failure shouldn't fail the request
    
    async def get_cached_analytics(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached analytics if fresh (less than 1 hour old)
        
        Args:
            user_id: User ID
            
        Returns:
            Cached analytics data or None if not fresh
        """
        try:
            cache_doc = db.collection('analytics-cache').document(user_id).get()
            
            if not cache_doc.exists:
                return None
            
            cache_data = cache_doc.to_dict()
            cached_at = cache_data.get('cachedAt')
            
            if not cached_at:
                return None
            
            # Convert Firestore timestamp to datetime if needed
            if hasattr(cached_at, 'timestamp'):
                cached_at = datetime.fromtimestamp(cached_at.timestamp())
            
            # Check if cache is fresh (less than 1 hour old)
            now = datetime.utcnow()
            age = now - cached_at
            
            if age.total_seconds() < 3600:  # 1 hour = 3600 seconds
                logger.info(f"Cache hit for user {user_id} (age: {age.total_seconds():.0f}s)")
                return cache_data
            else:
                logger.info(f"Cache expired for user {user_id} (age: {age.total_seconds():.0f}s)")
                return None
                
        except Exception as e:
            logger.error(f"Error getting cached analytics: {str(e)}")
            return None
    
    def is_configured(self) -> bool:
        """
        Check if Twitter API is configured for analytics
        
        Returns:
            True if client is initialized, False otherwise
        """
        return self.client is not None
