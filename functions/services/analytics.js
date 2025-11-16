const { TwitterApi } = require('twitter-api-v2');
const { db, serverTimestamp } = require('../config/firebase');

// Lazy initialization of Twitter client
let twitterClient = null;

const getTwitterClient = () => {
  if (!twitterClient) {
    const {
      TWITTER_API_KEY,
      TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET
    } = process.env;

    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
      throw new Error('Twitter API credentials are required for analytics. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET in environment variables.');
    }

    twitterClient = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: TWITTER_ACCESS_TOKEN,
      accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
    });
  }
  return twitterClient;
};

/**
 * Fetch Twitter analytics for a single post
 * @param {Array<string>} tweetIds - Array of tweet IDs
 * @returns {Object} Analytics data for the post
 */
const fetchPostAnalytics = async (tweetIds) => {
  try {
    if (!tweetIds || tweetIds.length === 0) {
      return {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0
      };
    }

    const client = getTwitterClient();
    
    // Fetch tweet data with public metrics
    const response = await client.v2.tweets(tweetIds, {
      'tweet.fields': ['public_metrics', 'created_at']
    });

    if (!response.data || response.data.length === 0) {
      console.warn('No tweet data returned for IDs:', tweetIds);
      return {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0
      };
    }

    // Aggregate metrics across all tweets in the thread
    let totalImpressions = 0;
    let totalLikes = 0;
    let totalRetweets = 0;
    let totalReplies = 0;
    let totalQuotes = 0;

    response.data.forEach(tweet => {
      const metrics = tweet.public_metrics || {};
      totalImpressions += metrics.impression_count || 0;
      totalLikes += metrics.like_count || 0;
      totalRetweets += metrics.retweet_count || 0;
      totalReplies += metrics.reply_count || 0;
      totalQuotes += metrics.quote_count || 0;
    });

    return {
      impressions: totalImpressions,
      likes: totalLikes,
      retweets: totalRetweets,
      replies: totalReplies,
      quotes: totalQuotes,
      tweetCount: response.data.length
    };

  } catch (error) {
    console.error('Error fetching post analytics:', error);
    
    // Return zero metrics on error to avoid breaking aggregation
    return {
      impressions: 0,
      likes: 0,
      retweets: 0,
      replies: 0,
      quotes: 0,
      error: error.message
    };
  }
};

/**
 * Calculate week-over-week growth
 * @param {Array} posts - Array of posts with analytics and dates
 * @returns {Object} Growth metrics
 */
const calculateWeekOverWeekGrowth = (posts) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Filter posts by time periods
  const thisWeekPosts = posts.filter(post => {
    const postDate = new Date(post.postedAt);
    return postDate >= oneWeekAgo && postDate <= now;
  });

  const lastWeekPosts = posts.filter(post => {
    const postDate = new Date(post.postedAt);
    return postDate >= twoWeeksAgo && postDate < oneWeekAgo;
  });

  // Calculate metrics for each period
  const thisWeekMetrics = {
    posts: thisWeekPosts.length,
    impressions: thisWeekPosts.reduce((sum, post) => sum + (post.analytics?.impressions || 0), 0),
    likes: thisWeekPosts.reduce((sum, post) => sum + (post.analytics?.likes || 0), 0),
    engagements: thisWeekPosts.reduce((sum, post) => sum + (post.analytics?.totalEngagements || 0), 0)
  };

  const lastWeekMetrics = {
    posts: lastWeekPosts.length,
    impressions: lastWeekPosts.reduce((sum, post) => sum + (post.analytics?.impressions || 0), 0),
    likes: lastWeekPosts.reduce((sum, post) => sum + (post.analytics?.likes || 0), 0),
    engagements: lastWeekPosts.reduce((sum, post) => sum + (post.analytics?.totalEngagements || 0), 0)
  };

  // Calculate growth percentages
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    thisWeek: thisWeekMetrics,
    lastWeek: lastWeekMetrics,
    growth: {
      posts: calculateGrowth(thisWeekMetrics.posts, lastWeekMetrics.posts),
      impressions: calculateGrowth(thisWeekMetrics.impressions, lastWeekMetrics.impressions),
      likes: calculateGrowth(thisWeekMetrics.likes, lastWeekMetrics.likes),
      engagements: calculateGrowth(thisWeekMetrics.engagements, lastWeekMetrics.engagements)
    }
  };
};

/**
 * Get cached analytics data
 * @param {string} userId - User ID
 * @returns {Object|null} Cached analytics data or null if not found/expired
 */
const getCachedAnalytics = async (userId) => {
  try {
    const cacheRef = db.collection('analytics-cache').doc(userId);
    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) {
      return null;
    }

    const cacheData = cacheDoc.data();
    const cacheTime = cacheData.cachedAt?.toDate?.() || new Date(cacheData.cachedAt);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    // Check if cache is still valid (less than 1 hour old)
    if (cacheTime > oneHourAgo) {
      console.log(`Using cached analytics for user ${userId}`);
      return cacheData.analytics;
    }

    console.log(`Cache expired for user ${userId}, will fetch fresh data`);
    return null;

  } catch (error) {
    console.error('Error reading analytics cache:', error);
    return null;
  }
};

/**
 * Cache analytics data
 * @param {string} userId - User ID
 * @param {Object} analytics - Analytics data to cache
 */
const cacheAnalytics = async (userId, analytics) => {
  try {
    const cacheRef = db.collection('analytics-cache').doc(userId);
    await cacheRef.set({
      userId,
      analytics,
      cachedAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    });

    console.log(`Cached analytics for user ${userId}`);
  } catch (error) {
    console.error('Error caching analytics:', error);
    // Don't throw error - caching failure shouldn't break the main function
  }
};

/**
 * Get comprehensive analytics for a user (Business tier only)
 * @param {string} userId - User ID
 * @param {Object} options - Options for analytics calculation
 * @returns {Object} Comprehensive analytics data
 */
const getUserAnalytics = async (userId, options = {}) => {
  try {
    console.log(`Fetching analytics for user ${userId}`);

    // Check cache first unless forced refresh
    if (!options.forceRefresh) {
      const cachedData = await getCachedAnalytics(userId);
      if (cachedData) {
        return cachedData;
      }
    }

    // Query user's posts from Firestore
    const postsSnapshot = await db.collection('posts')
      .where('userId', '==', userId)
      .orderBy('postedAt', 'desc')
      .get();

    if (postsSnapshot.empty) {
      const emptyAnalytics = {
        totalPosts: 0,
        totalImpressions: 0,
        totalLikes: 0,
        totalRetweets: 0,
        totalReplies: 0,
        totalQuotes: 0,
        totalEngagements: 0,
        averageEngagementRate: 0,
        weekOverWeek: {
          thisWeek: { posts: 0, impressions: 0, likes: 0, engagements: 0 },
          lastWeek: { posts: 0, impressions: 0, likes: 0, engagements: 0 },
          growth: { posts: 0, impressions: 0, likes: 0, engagements: 0 }
        },
        topPerformingPosts: [],
        generatedAt: new Date().toISOString(),
        message: 'No posts found for analytics'
      };

      // Cache empty result
      await cacheAnalytics(userId, emptyAnalytics);
      return emptyAnalytics;
    }

    console.log(`Found ${postsSnapshot.size} posts for user ${userId}`);

    // Process posts and fetch analytics
    const posts = [];
    const analyticsPromises = [];

    postsSnapshot.forEach(doc => {
      const postData = doc.data();
      posts.push({
        postId: postData.postId,
        jobId: postData.jobId,
        threadIndex: postData.threadIndex,
        hook: postData.hook,
        tweetIds: postData.tweetIds,
        threadUrl: postData.threadUrl,
        tweetCount: postData.tweetCount,
        postedAt: postData.postedAt?.toDate?.()?.toISOString() || postData.postedAt
      });

      // Add promise to fetch analytics for this post
      analyticsPromises.push(
        fetchPostAnalytics(postData.tweetIds).then(analytics => ({
          postId: postData.postId,
          analytics
        }))
      );
    });

    // Fetch all analytics in parallel
    console.log('Fetching Twitter analytics for all posts...');
    const analyticsResults = await Promise.all(analyticsPromises);

    // Map analytics back to posts
    const postsWithAnalytics = posts.map(post => {
      const analyticsData = analyticsResults.find(result => result.postId === post.postId);
      const analytics = analyticsData?.analytics || {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0
      };

      // Calculate total engagements for this post
      const totalEngagements = analytics.likes + analytics.retweets + analytics.replies + analytics.quotes;

      return {
        ...post,
        analytics: {
          ...analytics,
          totalEngagements,
          engagementRate: analytics.impressions > 0 ? (totalEngagements / analytics.impressions) * 100 : 0
        }
      };
    });

    // Calculate aggregated metrics
    const totalImpressions = postsWithAnalytics.reduce((sum, post) => sum + post.analytics.impressions, 0);
    const totalLikes = postsWithAnalytics.reduce((sum, post) => sum + post.analytics.likes, 0);
    const totalRetweets = postsWithAnalytics.reduce((sum, post) => sum + post.analytics.retweets, 0);
    const totalReplies = postsWithAnalytics.reduce((sum, post) => sum + post.analytics.replies, 0);
    const totalQuotes = postsWithAnalytics.reduce((sum, post) => sum + post.analytics.quotes, 0);
    const totalEngagements = totalLikes + totalRetweets + totalReplies + totalQuotes;

    // Calculate week-over-week growth
    const weekOverWeek = calculateWeekOverWeekGrowth(postsWithAnalytics);

    // Find top performing posts
    const topPerformingPosts = postsWithAnalytics
      .sort((a, b) => b.analytics.totalEngagements - a.analytics.totalEngagements)
      .slice(0, 5)
      .map(post => ({
        postId: post.postId,
        hook: post.hook,
        threadUrl: post.threadUrl,
        postedAt: post.postedAt,
        metrics: {
          impressions: post.analytics.impressions,
          likes: post.analytics.likes,
          retweets: post.analytics.retweets,
          replies: post.analytics.replies,
          totalEngagements: post.analytics.totalEngagements,
          engagementRate: Math.round(post.analytics.engagementRate * 100) / 100
        }
      }));

    // Compile final analytics
    const analytics = {
      totalPosts: posts.length,
      totalImpressions,
      totalLikes,
      totalRetweets,
      totalReplies,
      totalQuotes,
      totalEngagements,
      averageEngagementRate: totalImpressions > 0 ? Math.round((totalEngagements / totalImpressions) * 10000) / 100 : 0,
      weekOverWeek,
      topPerformingPosts,
      generatedAt: new Date().toISOString(),
      dataPoints: postsWithAnalytics.length
    };

    console.log(`Analytics calculated for user ${userId}: ${analytics.totalPosts} posts, ${analytics.totalEngagements} total engagements`);

    // Cache the results
    await cacheAnalytics(userId, analytics);

    return analytics;

  } catch (error) {
    console.error('Error getting user analytics:', error);
    
    // Return error analytics to avoid breaking the API
    const errorAnalytics = {
      totalPosts: 0,
      totalImpressions: 0,
      totalLikes: 0,
      totalRetweets: 0,
      totalReplies: 0,
      totalQuotes: 0,
      totalEngagements: 0,
      averageEngagementRate: 0,
      weekOverWeek: {
        thisWeek: { posts: 0, impressions: 0, likes: 0, engagements: 0 },
        lastWeek: { posts: 0, impressions: 0, likes: 0, engagements: 0 },
        growth: { posts: 0, impressions: 0, likes: 0, engagements: 0 }
      },
      topPerformingPosts: [],
      generatedAt: new Date().toISOString(),
      error: error.message
    };

    return errorAnalytics;
  }
};

/**
 * Clear analytics cache for a user
 * @param {string} userId - User ID
 */
const clearAnalyticsCache = async (userId) => {
  try {
    const cacheRef = db.collection('analytics-cache').doc(userId);
    await cacheRef.delete();
    console.log(`Cleared analytics cache for user ${userId}`);
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    throw error;
  }
};

/**
 * Get analytics cache status
 * @param {string} userId - User ID
 * @returns {Object} Cache status information
 */
const getAnalyticsCacheStatus = async (userId) => {
  try {
    const cacheRef = db.collection('analytics-cache').doc(userId);
    const cacheDoc = await cacheRef.get();

    if (!cacheDoc.exists) {
      return {
        cached: false,
        message: 'No cache found'
      };
    }

    const cacheData = cacheDoc.data();
    const cacheTime = cacheData.cachedAt?.toDate?.() || new Date(cacheData.cachedAt);
    const expiryTime = cacheData.expiresAt?.toDate?.() || new Date(cacheData.expiresAt);
    const now = new Date();

    return {
      cached: true,
      cachedAt: cacheTime.toISOString(),
      expiresAt: expiryTime.toISOString(),
      isExpired: now > expiryTime,
      minutesUntilExpiry: Math.max(0, Math.floor((expiryTime - now) / (60 * 1000)))
    };

  } catch (error) {
    console.error('Error checking cache status:', error);
    return {
      cached: false,
      error: error.message
    };
  }
};

module.exports = {
  getUserAnalytics,
  clearAnalyticsCache,
  getAnalyticsCacheStatus,
  fetchPostAnalytics
};
