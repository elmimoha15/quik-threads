const express = require('express');
const { verifyAuth } = require('../middleware/auth');
const { checkFeature } = require('../middleware/checkFeature');
const { getUserAnalytics } = require('../services/analytics');

const router = express.Router();

/**
 * Calculate engagement trend data from posts
 * @param {Array} posts - Posts with analytics data
 * @returns {Array} Daily engagement trend
 */
const calculateEngagementTrend = (posts) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Create array for last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push({
      day: date.toISOString().split('T')[0], // YYYY-MM-DD format
      date: date,
      engagements: 0
    });
  }

  // Filter posts from last 7 days and aggregate by day
  const recentPosts = posts.filter(post => {
    const postDate = new Date(post.postedAt);
    return postDate >= sevenDaysAgo && postDate <= now;
  });

  // Add engagements to corresponding days
  recentPosts.forEach(post => {
    const postDate = new Date(post.postedAt);
    const dayString = postDate.toISOString().split('T')[0];
    
    const dayData = days.find(d => d.day === dayString);
    if (dayData && post.analytics) {
      dayData.engagements += post.analytics.totalEngagements || 0;
    }
  });

  // Return only day and engagements
  return days.map(({ day, engagements }) => ({ day, engagements }));
};

/**
 * Format top posts for response
 * @param {Array} topPerformingPosts - Top posts from analytics
 * @returns {Array} Formatted top posts
 */
const formatTopPosts = (topPerformingPosts) => {
  return topPerformingPosts.map(post => ({
    title: post.hook || 'Untitled Thread',
    engagement: post.metrics?.totalEngagements || 0,
    postId: post.postId,
    threadUrl: post.threadUrl,
    postedAt: post.postedAt,
    metrics: {
      impressions: post.metrics?.impressions || 0,
      likes: post.metrics?.likes || 0,
      retweets: post.metrics?.retweets || 0,
      replies: post.metrics?.replies || 0,
      engagementRate: post.metrics?.engagementRate || 0
    }
  }));
};

/**
 * GET /api/analytics - Get user analytics (Business tier only)
 * Requires authentication and 'analytics' feature access
 */
router.get('/', verifyAuth, checkFeature('analytics'), async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`Analytics request from user ${userId}`);

    // Get comprehensive analytics from service
    const analyticsData = await getUserAnalytics(userId);

    if (!analyticsData) {
      return res.status(500).json({
        error: 'Analytics Error',
        message: 'Failed to retrieve analytics data'
      });
    }

    // Calculate engagement trend for last 7 days
    const engagementTrend = calculateEngagementTrend(
      analyticsData.topPerformingPosts || []
    );

    // Format top posts
    const topPosts = formatTopPosts(analyticsData.topPerformingPosts || []);

    // Format response according to specification
    const response = {
      totalImpressions: analyticsData.totalImpressions || 0,
      totalReach: analyticsData.totalImpressions || 0, // Using impressions as reach approximation
      totalLikes: analyticsData.totalLikes || 0,
      totalEngagements: analyticsData.totalEngagements || 0,
      weekOverWeekGrowth: {
        posts: analyticsData.weekOverWeek?.growth?.posts || 0,
        impressions: analyticsData.weekOverWeek?.growth?.impressions || 0,
        likes: analyticsData.weekOverWeek?.growth?.likes || 0,
        engagements: analyticsData.weekOverWeek?.growth?.engagements || 0
      },
      postsThisWeek: analyticsData.weekOverWeek?.thisWeek?.posts || 0,
      engagementTrend,
      topPosts,
      // Additional useful data
      totalPosts: analyticsData.totalPosts || 0,
      totalRetweets: analyticsData.totalRetweets || 0,
      totalReplies: analyticsData.totalReplies || 0,
      totalQuotes: analyticsData.totalQuotes || 0,
      averageEngagementRate: analyticsData.averageEngagementRate || 0,
      generatedAt: analyticsData.generatedAt,
      cached: analyticsData.cached || false
    };

    // Add metadata if available
    if (analyticsData.error) {
      response.warning = analyticsData.error;
    }

    if (analyticsData.message) {
      response.message = analyticsData.message;
    }

    console.log(`Analytics returned for user ${userId}: ${response.totalPosts} posts, ${response.totalEngagements} engagements`);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Analytics endpoint error:', error);
    
    res.status(500).json({
      error: 'Analytics Error',
      message: 'Failed to retrieve analytics data',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/cache-status - Get cache status for user analytics
 */
router.get('/cache-status', verifyAuth, checkFeature('analytics'), async (req, res) => {
  try {
    const userId = req.userId;
    const { getAnalyticsCacheStatus } = require('../services/analytics');
    
    const cacheStatus = await getAnalyticsCacheStatus(userId);
    
    res.json({
      success: true,
      cache: cacheStatus
    });

  } catch (error) {
    console.error('Cache status error:', error);
    res.status(500).json({
      error: 'Cache Error',
      message: 'Failed to get cache status',
      details: error.message
    });
  }
});

/**
 * POST /api/analytics/refresh - Force refresh analytics cache
 */
router.post('/refresh', verifyAuth, checkFeature('analytics'), async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`Force refresh analytics for user ${userId}`);

    // Get fresh analytics data (bypass cache)
    const analyticsData = await getUserAnalytics(userId, { forceRefresh: true });

    if (!analyticsData) {
      return res.status(500).json({
        error: 'Analytics Error',
        message: 'Failed to refresh analytics data'
      });
    }

    res.json({
      success: true,
      message: 'Analytics data refreshed successfully',
      generatedAt: analyticsData.generatedAt,
      totalPosts: analyticsData.totalPosts,
      totalEngagements: analyticsData.totalEngagements
    });

  } catch (error) {
    console.error('Analytics refresh error:', error);
    res.status(500).json({
      error: 'Refresh Error',
      message: 'Failed to refresh analytics data',
      details: error.message
    });
  }
});

/**
 * DELETE /api/analytics/cache - Clear analytics cache for user
 */
router.delete('/cache', verifyAuth, checkFeature('analytics'), async (req, res) => {
  try {
    const userId = req.userId;
    const { clearAnalyticsCache } = require('../services/analytics');
    
    await clearAnalyticsCache(userId);
    
    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Cache Error',
      message: 'Failed to clear analytics cache',
      details: error.message
    });
  }
});

/**
 * GET /api/analytics/test - Test analytics endpoint (Business users only)
 */
router.get('/test', verifyAuth, checkFeature('analytics'), async (req, res) => {
  try {
    const userId = req.userId;
    
    res.json({
      success: true,
      message: 'Analytics endpoint accessible',
      userId,
      timestamp: new Date().toISOString(),
      features: {
        analytics: true,
        businessTier: true
      },
      endpoints: {
        'GET /api/analytics': 'Get comprehensive analytics data',
        'GET /api/analytics/cache-status': 'Check cache status',
        'POST /api/analytics/refresh': 'Force refresh analytics',
        'DELETE /api/analytics/cache': 'Clear analytics cache',
        'GET /api/analytics/test': 'Test endpoint access'
      }
    });

  } catch (error) {
    console.error('Analytics test error:', error);
    res.status(500).json({
      error: 'Test Error',
      message: 'Analytics test failed',
      details: error.message
    });
  }
});

module.exports = router;
