const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, serverTimestamp } = require('../config/firebase');
const { checkFeature } = require('../middleware/checkFeature');
const { postThread } = require('../services/twitter');

const router = express.Router();

/**
 * POST /api/twitter/post
 * Post a thread to Twitter/X from a completed job
 */
router.post('/post', checkFeature('postToX'), async (req, res) => {
  try {
    const { jobId, threadIndex } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate request body
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        error: 'Valid jobId is required'
      });
    }
    
    if (threadIndex === undefined || threadIndex === null || typeof threadIndex !== 'number') {
      return res.status(400).json({
        error: 'Valid threadIndex is required (number)'
      });
    }
    
    if (threadIndex < 0) {
      return res.status(400).json({
        error: 'threadIndex must be 0 or greater'
      });
    }
    
    console.log(`Processing Twitter post request - User: ${userId}, Job: ${jobId}, Thread: ${threadIndex}`);
    
    // Get job from Firestore
    const jobRef = db.collection('jobs').doc(jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({
        error: 'Job not found',
        jobId
      });
    }
    
    const jobData = jobDoc.data();
    
    // Verify job ownership
    if (jobData.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only post threads from your own jobs.',
        jobId
      });
    }
    
    // Verify job is completed
    if (jobData.status !== 'completed') {
      return res.status(400).json({
        error: `Cannot post thread from ${jobData.status} job. Job must be completed first.`,
        jobId,
        currentStatus: jobData.status
      });
    }
    
    // Verify job has results with threads
    if (!jobData.result || !jobData.result.threads || !Array.isArray(jobData.result.threads)) {
      return res.status(400).json({
        error: 'Job does not contain any generated threads',
        jobId
      });
    }
    
    const threads = jobData.result.threads;
    
    // Verify threadIndex is valid
    if (threadIndex >= threads.length) {
      return res.status(400).json({
        error: `Thread index ${threadIndex} is out of range. Job has ${threads.length} threads (0-${threads.length - 1}).`,
        jobId,
        threadIndex,
        availableThreads: threads.length
      });
    }
    
    const selectedThread = threads[threadIndex];
    
    // Verify thread has tweets
    if (!selectedThread.tweets || !Array.isArray(selectedThread.tweets) || selectedThread.tweets.length === 0) {
      return res.status(400).json({
        error: `Selected thread ${threadIndex} has no tweets`,
        jobId,
        threadIndex
      });
    }
    
    console.log(`Posting thread ${threadIndex} with ${selectedThread.tweets.length} tweets`);
    
    // Post thread to Twitter
    let postResult;
    try {
      postResult = await postThread(userId, selectedThread.tweets);
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      
      // Return specific error based on type
      if (error.message.includes('Rate limit')) {
        return res.status(429).json({
          error: 'Twitter rate limit exceeded',
          message: error.message,
          retryAfter: 'Please try again in a few minutes'
        });
      } else if (error.message.includes('Access denied') || error.message.includes('Upgrade')) {
        return res.status(403).json({
          error: 'Feature access denied',
          message: error.message
        });
      } else if (error.message.includes('authentication') || error.message.includes('credentials')) {
        return res.status(500).json({
          error: 'Twitter API configuration error',
          message: 'Please contact support - Twitter integration needs configuration'
        });
      } else {
        return res.status(500).json({
          error: 'Failed to post thread to Twitter',
          message: error.message
        });
      }
    }
    
    console.log(`Thread posted successfully: ${postResult.threadUrl}`);
    
    // Generate unique post ID
    const postId = uuidv4();
    
    // Save post record to Firestore
    const postData = {
      postId,
      userId,
      jobId,
      threadIndex,
      threadNumber: selectedThread.threadNumber || threadIndex + 1,
      hook: selectedThread.hook || selectedThread.tweets[0]?.substring(0, 100) || '',
      tweetIds: postResult.tweetIds,
      threadUrl: postResult.threadUrl,
      username: postResult.username || null,
      tweetCount: postResult.tweetCount,
      postedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      
      // Additional metadata for analytics
      originalJobData: {
        type: jobData.type,
        fileUrl: jobData.fileUrl,
        contentUrl: jobData.contentUrl,
        transcriptionWordCount: jobData.result?.transcription?.wordCount || 0,
        transcriptionDuration: jobData.result?.transcription?.duration || 0
      }
    };
    
    try {
      await db.collection('posts').doc(postId).set(postData);
      console.log(`Post record saved: ${postId}`);
    } catch (error) {
      console.error('Error saving post record:', error);
      // Don't fail the request if we can't save the record - the tweet was already posted
      console.warn('Tweet was posted successfully but post record could not be saved');
    }
    
    // Return success response
    res.json({
      success: true,
      threadUrl: postResult.threadUrl,
      postId,
      tweetCount: postResult.tweetCount,
      postedAt: postResult.postedAt,
      message: 'Thread posted successfully to X'
    });
    
  } catch (error) {
    console.error('Error in Twitter post endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/twitter/posts
 * Get user's posted threads with pagination
 */
router.get('/posts', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { limit = 20, offset = 0 } = req.query;
    
    // Validate pagination parameters
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 posts per request
    const offsetNum = parseInt(offset) || 0;
    
    // Build query
    let query = db.collection('posts')
      .where('userId', '==', userId)
      .orderBy('postedAt', 'desc');
    
    // Apply pagination
    if (offsetNum > 0) {
      const skipQuery = query.limit(offsetNum);
      const skipSnapshot = await skipQuery.get();
      
      if (!skipSnapshot.empty) {
        const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    query = query.limit(limitNum);
    
    // Execute query
    const snapshot = await query.get();
    
    // Format posts data
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        postId: data.postId,
        jobId: data.jobId,
        threadIndex: data.threadIndex,
        threadNumber: data.threadNumber,
        hook: data.hook,
        threadUrl: data.threadUrl,
        username: data.username,
        tweetCount: data.tweetCount,
        postedAt: data.postedAt?.toDate?.()?.toISOString() || data.postedAt,
        originalJobData: data.originalJobData || null
      });
    });
    
    res.json({
      success: true,
      posts,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: posts.length,
        hasMore: posts.length === limitNum
      }
    });
    
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/twitter/posts/:postId
 * Get specific post details
 */
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From auth middleware
    
    if (!postId) {
      return res.status(400).json({
        error: 'Post ID is required'
      });
    }
    
    // Get post document
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        postId
      });
    }
    
    const postData = postDoc.data();
    
    // Verify post ownership
    if (postData.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only view your own posts.',
        postId
      });
    }
    
    // Format post data
    const formattedPost = {
      postId: postData.postId,
      jobId: postData.jobId,
      threadIndex: postData.threadIndex,
      threadNumber: postData.threadNumber,
      hook: postData.hook,
      tweetIds: postData.tweetIds,
      threadUrl: postData.threadUrl,
      username: postData.username,
      tweetCount: postData.tweetCount,
      postedAt: postData.postedAt?.toDate?.()?.toISOString() || postData.postedAt,
      createdAt: postData.createdAt?.toDate?.()?.toISOString() || postData.createdAt,
      originalJobData: postData.originalJobData || null
    };
    
    res.json({
      success: true,
      post: formattedPost
    });
    
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/twitter/posts/:postId
 * Delete post record (does not delete from Twitter)
 */
router.delete('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // From auth middleware
    
    if (!postId) {
      return res.status(400).json({
        error: 'Post ID is required'
      });
    }
    
    // Get post document
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        error: 'Post not found',
        postId
      });
    }
    
    const postData = postDoc.data();
    
    // Verify post ownership
    if (postData.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied. You can only delete your own posts.',
        postId
      });
    }
    
    // Delete the post record
    await postRef.delete();
    
    res.json({
      success: true,
      message: 'Post record deleted successfully',
      postId,
      note: 'This only removes the record from our database. The thread remains on X/Twitter.'
    });
    
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/twitter/test
 * Test endpoint to verify Twitter API is working
 */
router.get('/test', checkFeature('postToX'), (req, res) => {
  res.json({
    success: true,
    message: 'Twitter API endpoint is working',
    timestamp: new Date().toISOString(),
    userId: req.userId,
    hasPostToXFeature: true
  });
});

module.exports = router;
