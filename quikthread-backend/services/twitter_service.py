import tweepy
from typing import List, Dict, Any, Optional
from config.settings import settings
import logging
import time
from utils.logger import log_error, log_event

logger = logging.getLogger(__name__)

class TwitterService:
    """Service for posting threads to X (Twitter)"""
    
    def __init__(self):
        """Initialize Twitter API v2 client"""
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
                logger.info("Twitter API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twitter client: {str(e)}")
        else:
            logger.warning("Twitter API credentials not fully configured")
    
    def post_thread(self, tweets: List[str]) -> Dict[str, Any]:
        """
        Post a thread to X (Twitter)
        
        Posts the first tweet, then replies to it with subsequent tweets
        to create a threaded conversation.
        
        Rate limits: Twitter API v2 allows 50 tweets per 15 minutes
        
        Args:
            tweets: List of tweet texts to post as a thread
            
        Returns:
            Dict with success status, thread URL, tweet IDs, or error message
        """
        try:
            if not self.client:
                return {
                    "success": False,
                    "error": "Twitter API client not configured. Please add Twitter credentials to .env"
                }
            
            if not tweets or len(tweets) == 0:
                return {
                    "success": False,
                    "error": "No tweets provided"
                }
            
            # Check rate limit (50 tweets per 15 minutes)
            if len(tweets) > 50:
                return {
                    "success": False,
                    "error": f"Thread too long ({len(tweets)} tweets). Maximum 50 tweets per thread due to rate limits."
                }
            
            tweet_ids = []
            previous_tweet_id = None
            
            # Post each tweet in the thread
            for i, tweet_text in enumerate(tweets):
                try:
                    # Validate tweet length (280 characters for Twitter)
                    if len(tweet_text) > 280:
                        logger.warning(f"Tweet {i+1} exceeds 280 characters, truncating...")
                        tweet_text = tweet_text[:277] + "..."
                    
                    # Post tweet (reply to previous if not first tweet)
                    if previous_tweet_id is None:
                        # First tweet in thread
                        response = self.client.create_tweet(text=tweet_text)
                    else:
                        # Reply to previous tweet
                        response = self.client.create_tweet(
                            text=tweet_text,
                            in_reply_to_tweet_id=previous_tweet_id
                        )
                    
                    # Extract tweet ID from response
                    tweet_id = response.data['id']
                    tweet_ids.append(tweet_id)
                    previous_tweet_id = tweet_id
                    
                    logger.info(f"Posted tweet {i+1}/{len(tweets)}: {tweet_id}")
                    
                    # Small delay between tweets to avoid rate limiting
                    if i < len(tweets) - 1:
                        time.sleep(1)
                    
                except tweepy.TweepyException as e:
                    logger.error(f"Error posting tweet {i+1}: {str(e)}")
                    return {
                        "success": False,
                        "error": f"Failed to post tweet {i+1}: {str(e)}",
                        "partial_tweet_ids": tweet_ids
                    }
            
            # Get username for thread URL
            try:
                user = self.client.get_me()
                username = user.data.username
            except Exception as e:
                logger.warning(f"Could not get username: {str(e)}")
                username = "unknown"
            
            # Construct thread URL (first tweet in thread)
            thread_url = f"https://twitter.com/{username}/status/{tweet_ids[0]}"
            
            logger.info(f"Successfully posted thread with {len(tweet_ids)} tweets")
            
            return {
                "success": True,
                "thread_url": thread_url,
                "tweet_ids": tweet_ids,
                "tweet_count": len(tweet_ids)
            }
            
        except tweepy.TweepyException as e:
            # Log Twitter API error
            log_error(e, {
                "service": "twitter",
                "operation": "post_thread",
                "tweet_count": len(tweets)
            })
            
            logger.error(f"Twitter API error: {str(e)}")
            return {
                "success": False,
                "error": f"Twitter API error: {str(e)}"
            }
        except Exception as e:
            # Log unexpected error
            log_error(e, {
                "service": "twitter",
                "operation": "post_thread",
                "tweet_count": len(tweets)
            })
            
            logger.error(f"Unexpected error posting thread: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def is_configured(self) -> bool:
        """
        Check if Twitter API is properly configured
        
        Returns:
            True if client is initialized, False otherwise
        """
        return self.client is not None
