const { TwitterApi } = require('twitter-api-v2');
const { getUserProfile } = require('../api/users');

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
      throw new Error('Twitter API credentials are required. Please set TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET in environment variables.');
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
 * Rate limiting tracker for Twitter API
 * Twitter allows 50 tweets per 15-minute window
 */
const rateLimitTracker = {
  tweets: [],
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxTweets: 50,

  canPost(tweetCount = 1) {
    const now = Date.now();
    // Remove tweets older than 15 minutes
    this.tweets = this.tweets.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if adding new tweets would exceed limit
    return this.tweets.length + tweetCount <= this.maxTweets;
  },

  recordTweets(tweetCount = 1) {
    const now = Date.now();
    for (let i = 0; i < tweetCount; i++) {
      this.tweets.push(now);
    }
  },

  getTimeUntilReset() {
    if (this.tweets.length === 0) return 0;
    
    const oldestTweet = Math.min(...this.tweets);
    const resetTime = oldestTweet + this.windowMs;
    const now = Date.now();
    
    return Math.max(0, resetTime - now);
  }
};

/**
 * Validate that user has postToX feature
 * @param {string} userId - User ID
 * @throws {Error} If user doesn't have postToX feature
 */
const validateUserCanPost = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    if (!userProfile.features || !userProfile.features.postToX) {
      throw new Error('Access denied. Upgrade to Pro or Business plan to post to X. Visit https://quikthread.com/pricing to upgrade.');
    }
    
    return userProfile;
  } catch (error) {
    if (error.message.includes('Access denied')) {
      throw error; // Re-throw feature access errors as-is
    }
    throw new Error(`Failed to validate user permissions: ${error.message}`);
  }
};

/**
 * Generate thread URL from first tweet ID
 * @param {string} tweetId - First tweet ID in thread
 * @param {string} username - Twitter username (optional)
 * @returns {string} Thread URL
 */
const generateThreadUrl = (tweetId, username = null) => {
  if (username) {
    return `https://twitter.com/${username}/status/${tweetId}`;
  }
  return `https://twitter.com/i/status/${tweetId}`;
};

/**
 * Post a thread to Twitter/X
 * @param {string} userId - User ID
 * @param {Array<string>} threadTweets - Array of tweet texts
 * @param {Object} options - Additional options
 * @returns {Object} { threadUrl, tweetIds, username }
 */
const postThread = async (userId, threadTweets, options = {}) => {
  try {
    console.log(`Starting thread post for user ${userId}, ${threadTweets.length} tweets`);
    
    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid userId is required');
    }
    
    if (!Array.isArray(threadTweets) || threadTweets.length === 0) {
      throw new Error('threadTweets must be a non-empty array');
    }
    
    if (threadTweets.length > 25) {
      throw new Error('Thread cannot exceed 25 tweets (Twitter limit)');
    }
    
    // Validate each tweet length
    threadTweets.forEach((tweet, index) => {
      if (!tweet || typeof tweet !== 'string') {
        throw new Error(`Tweet ${index + 1} must be a non-empty string`);
      }
      if (tweet.length > 280) {
        throw new Error(`Tweet ${index + 1} exceeds 280 characters (${tweet.length} chars)`);
      }
    });
    
    // Validate user has postToX feature
    await validateUserCanPost(userId);
    
    // Check rate limits
    if (!rateLimitTracker.canPost(threadTweets.length)) {
      const resetTime = rateLimitTracker.getTimeUntilReset();
      const resetMinutes = Math.ceil(resetTime / (60 * 1000));
      throw new Error(`Rate limit exceeded. Can post again in ${resetMinutes} minutes. Twitter allows 50 tweets per 15-minute window.`);
    }
    
    // Get Twitter client
    const client = getTwitterClient();
    
    // Post first tweet
    console.log('Posting first tweet...');
    const firstTweetResponse = await client.v2.tweet(threadTweets[0]);
    
    if (!firstTweetResponse.data || !firstTweetResponse.data.id) {
      throw new Error('Failed to post first tweet - no tweet ID returned');
    }
    
    const tweetIds = [firstTweetResponse.data.id];
    let previousTweetId = firstTweetResponse.data.id;
    
    console.log(`First tweet posted: ${previousTweetId}`);
    
    // Post remaining tweets as replies
    for (let i = 1; i < threadTweets.length; i++) {
      console.log(`Posting tweet ${i + 1}/${threadTweets.length}...`);
      
      try {
        const replyResponse = await client.v2.tweet(threadTweets[i], {
          reply: {
            in_reply_to_tweet_id: previousTweetId
          }
        });
        
        if (!replyResponse.data || !replyResponse.data.id) {
          throw new Error(`Failed to post tweet ${i + 1} - no tweet ID returned`);
        }
        
        tweetIds.push(replyResponse.data.id);
        previousTweetId = replyResponse.data.id;
        
        console.log(`Tweet ${i + 1} posted: ${previousTweetId}`);
        
        // Add small delay between tweets to avoid hitting rate limits
        if (i < threadTweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
      } catch (error) {
        console.error(`Error posting tweet ${i + 1}:`, error);
        throw new Error(`Failed to post tweet ${i + 1}: ${error.message}`);
      }
    }
    
    // Record tweets for rate limiting
    rateLimitTracker.recordTweets(threadTweets.length);
    
    // Get user's Twitter username (optional, for better URL)
    let username = null;
    try {
      const userResponse = await client.v2.me();
      username = userResponse.data?.username;
    } catch (error) {
      console.warn('Could not fetch username for thread URL:', error.message);
    }
    
    // Generate thread URL
    const threadUrl = generateThreadUrl(tweetIds[0], username);
    
    console.log(`Thread posted successfully: ${threadUrl}`);
    
    return {
      threadUrl,
      tweetIds,
      username,
      postedAt: new Date().toISOString(),
      tweetCount: tweetIds.length
    };
    
  } catch (error) {
    console.error('Error posting thread:', error);
    
    // Enhance error messages for common issues
    if (error.message.includes('Rate limit')) {
      throw error; // Rate limit errors are already well formatted
    } else if (error.message.includes('Access denied')) {
      throw error; // Feature access errors are already well formatted
    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      throw new Error('Twitter API authentication failed. Please check your API credentials.');
    } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
      throw new Error('Twitter API access forbidden. Please check your API permissions and account status.');
    } else if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
      throw new Error('Twitter API rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to post thread: ${error.message}`);
    }
  }
};

/**
 * Get current rate limit status
 * @returns {Object} Rate limit information
 */
const getRateLimitStatus = () => {
  const now = Date.now();
  rateLimitTracker.tweets = rateLimitTracker.tweets.filter(timestamp => now - timestamp < rateLimitTracker.windowMs);
  
  return {
    tweetsUsed: rateLimitTracker.tweets.length,
    tweetsRemaining: rateLimitTracker.maxTweets - rateLimitTracker.tweets.length,
    maxTweets: rateLimitTracker.maxTweets,
    windowMs: rateLimitTracker.windowMs,
    timeUntilReset: rateLimitTracker.getTimeUntilReset(),
    canPost: rateLimitTracker.canPost(1)
  };
};

/**
 * Test Twitter API connection
 * @returns {Object} Connection test result
 */
const testConnection = async () => {
  try {
    const client = getTwitterClient();
    const userResponse = await client.v2.me();
    
    return {
      success: true,
      user: {
        id: userResponse.data.id,
        username: userResponse.data.username,
        name: userResponse.data.name
      },
      message: 'Twitter API connection successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Twitter API connection failed'
    };
  }
};

module.exports = {
  postThread,
  getRateLimitStatus,
  testConnection,
  validateUserCanPost
};
