const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, serverTimestamp } = require('../config/firebase');
const { getUserProfile } = require('./users');
const { fetchFromUrl } = require('../services/urlFetcher');
const { transcribe } = require('../services/deepgram');
const { generateThreads, generateThreadsFromTranscription } = require('../services/openai');

const router = express.Router();

/**
 * Update job status and progress in Firestore
 * @param {string} jobId - Job ID
 * @param {Object} updates - Updates to apply
 */
const updateJobStatus = async (jobId, updates) => {
  try {
    const jobRef = db.collection('jobs').doc(jobId);
    await jobRef.update({
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log(`Job ${jobId} updated:`, updates);
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
  }
};

/**
 * Increment user credits used
 * @param {string} userId - User ID
 */
const incrementUserCredits = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      creditsUsed: db.FieldValue.increment(1),
      updatedAt: serverTimestamp()
    });
    console.log(`Incremented credits for user ${userId}`);
  } catch (error) {
    console.error(`Error incrementing credits for user ${userId}:`, error);
  }
};

/**
 * Schedule file deletion after 24 hours
 * @param {string} filePath - Firebase Storage file path
 * @param {string} jobId - Job ID for logging
 */
const scheduleFileDeletion = (filePath, jobId) => {
  const deleteAfter24Hours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  setTimeout(async () => {
    try {
      const { storage } = require('../config/firebase');
      const bucket = storage.bucket();
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        console.log(`Auto-deleted file ${filePath} for job ${jobId} after 24 hours`);
      }
    } catch (error) {
      console.error(`Error auto-deleting file ${filePath} for job ${jobId}:`, error);
    }
  }, deleteAfter24Hours);
};

/**
 * Process content asynchronously
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID
 * @param {string} type - Processing type ('upload', 'url', or 'topic')
 * @param {string} fileUrl - File URL (for upload type)
 * @param {string} contentUrl - Content URL (for url type)
 * @param {string} topic - Topic text (for topic type)
 * @param {string} aiInstructions - AI instructions for content generation
 */
const processContentAsync = async (jobId, userId, type, fileUrl, contentUrl, topic, aiInstructions) => {
  let storageFilePath = null;
  
  try {
    console.log(`Starting async processing for job ${jobId}, type: ${type}`);
    
    // Get user profile for maxDuration
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    
    let transcriptionResult = null;
    
    if (type === 'topic') {
      // For topic type, skip transcription and go directly to thread generation
      await updateJobStatus(jobId, { 
        status: 'processing', 
        progress: 75,
        currentStep: 'Generating X threads from topic...'
      });
      
      // Generate threads directly from topic using OpenAI
      const threadsResult = await generateThreads(topic, aiInstructions);
      console.log(`Thread generation completed for job ${jobId}, threads: ${threadsResult.length}`);
      
      // Complete the job
      await updateJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Completed',
        result: {
          threads: threadsResult,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'gpt-4o-mini',
            threadCount: threadsResult.length,
            source: 'topic'
          }
        },
        completedAt: serverTimestamp()
      });
      
      // Increment user credits
      await incrementUserCredits(userId);
      
      console.log(`Job ${jobId} completed successfully`);
      return;
      
    } else {
      // Step 1: Fetch content (progress = 25%)
      await updateJobStatus(jobId, { 
        status: 'processing', 
        progress: 25,
        currentStep: 'Fetching content...'
      });
      
      if (type === 'upload') {
        // For upload type, the file is already in storage
        if (!fileUrl) {
          throw new Error('fileUrl is required for upload type');
        }
        
        // Extract storage path from fileUrl
        // Assuming fileUrl format: https://storage.googleapis.com/bucket/users/userId/uploads/filename
        const urlParts = fileUrl.split('/');
        const bucketIndex = urlParts.findIndex(part => part.includes('googleapis.com'));
        if (bucketIndex === -1) {
          throw new Error('Invalid fileUrl format');
        }
        storageFilePath = urlParts.slice(bucketIndex + 2).join('/'); // Skip domain and bucket
        
      } else if (type === 'url') {
        // For URL type, fetch the content
        if (!contentUrl) {
          throw new Error('contentUrl is required for url type');
        }
        
        const fetchResult = await fetchFromUrl(contentUrl, userId, userProfile.maxDuration);
        storageFilePath = fetchResult.storagePath;
        
      } else {
        throw new Error('Invalid type. Must be "upload", "url", or "topic"');
      }
      
      console.log(`Content fetched for job ${jobId}, storage path: ${storageFilePath}`);
      
      // Step 2: Transcribe (progress = 50%)
      await updateJobStatus(jobId, { 
        progress: 50,
        currentStep: 'Transcribing audio...',
        storageFilePath
      });
      
      transcriptionResult = await transcribe(storageFilePath);
      console.log(`Transcription completed for job ${jobId}, word count: ${transcriptionResult.wordCount}`);
      
      // Step 3: Generate threads (progress = 75%)
      await updateJobStatus(jobId, { 
        progress: 75,
        currentStep: 'Generating X threads...',
        transcription: {
          wordCount: transcriptionResult.wordCount,
          duration: transcriptionResult.duration,
          language: transcriptionResult.language
        }
      });
    }
    
    // Generate threads with AI instructions if provided
    const threadsResult = await generateThreadsFromTranscription(transcriptionResult.transcript, aiInstructions);
    console.log(`Thread generation completed for job ${jobId}, threads: ${threadsResult.length}`);
    
    // Step 4: Complete (progress = 100%)
    await updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Completed',
      result: {
        threads: threadsResult,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gpt-4o-mini',
          threadCount: threadsResult.length
        },
        transcription: {
          transcript: transcriptionResult.transcript,
          summary: transcriptionResult.summary,
          topics: transcriptionResult.topics,
          wordCount: transcriptionResult.wordCount,
          duration: transcriptionResult.duration,
          speakerCount: transcriptionResult.speakerCount
        }
      },
      completedAt: serverTimestamp()
    });
    
    // Step 5: Increment user credits
    await incrementUserCredits(userId);
    
    // Step 6: Schedule file deletion after 24 hours
    if (storageFilePath) {
      scheduleFileDeletion(storageFilePath, jobId);
    }
    
    console.log(`Job ${jobId} completed successfully`);
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Update job status to failed
    await updateJobStatus(jobId, {
      status: 'failed',
      progress: 0,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      failedAt: serverTimestamp()
    });
    
    // Still schedule file deletion if we have a file path
    if (storageFilePath) {
      scheduleFileDeletion(storageFilePath, jobId);
    }
  }
};

/**
 * POST /api/process
 * Main processing endpoint
 */
router.post('/', async (req, res) => {
  try {
    const { type, fileUrl, contentUrl, topic, aiInstructions } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate request
    if (!type || !['upload', 'url'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be "upload" or "url"'
      });
    }
    
    if (type === 'upload' && !fileUrl) {
      return res.status(400).json({
        error: 'fileUrl is required for upload type'
      });
    }
    
    if (type === 'url' && !contentUrl) {
      return res.status(400).json({
        error: 'contentUrl is required for url type'
      });
    }
    
    // Generate unique job ID
    const jobId = uuidv4();
    
    // Create job document in Firestore
    const jobData = {
      jobId,
      userId,
      type,
      fileUrl: fileUrl || null,
      contentUrl: contentUrl || null,
      topic: topic || null,
      aiInstructions: aiInstructions || null,
      status: 'processing',
      progress: 0,
      currentStep: 'Initializing...',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await db.collection('jobs').doc(jobId).set(jobData);
    console.log(`Created job ${jobId} for user ${userId}, type: ${type}`);
    
    // Start async processing (don't await)
    processContentAsync(jobId, userId, type, fileUrl, contentUrl, topic, aiInstructions).catch(error => {
      console.error(`Unhandled error in async processing for job ${jobId}:`, error);
    });
    
    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      message: 'Processing started. Use the job ID to check status.'
    });
    
  } catch (error) {
    console.error('Error in process endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/process/topic
 * Topic-only processing endpoint
 */
router.post('/topic', async (req, res) => {
  try {
    const { topic, aiInstructions } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate request
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({
        error: 'Topic is required and must be a non-empty string'
      });
    }
    
    // Generate unique job ID
    const jobId = uuidv4();
    
    // Create job document in Firestore
    const jobData = {
      jobId,
      userId,
      type: 'topic',
      topic: topic.trim(),
      aiInstructions: aiInstructions || null,
      status: 'processing',
      progress: 0,
      currentStep: 'Initializing...',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await db.collection('jobs').doc(jobId).set(jobData);
    console.log(`Created topic job ${jobId} for user ${userId}`);
    
    // Start async processing (don't await)
    processContentAsync(jobId, userId, 'topic', null, null, topic.trim(), aiInstructions).catch(error => {
      console.error(`Unhandled error in async processing for job ${jobId}:`, error);
    });
    
    // Return job ID immediately
    res.json({
      success: true,
      jobId,
      message: 'Topic processing started. Use the job ID to check status.'
    });
    
  } catch (error) {
    console.error('Error in topic processing endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/process/test
 * Test endpoint to verify process API is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Process API is working',
    timestamp: new Date().toISOString(),
    userId: req.userId || 'Not authenticated'
  });
});

module.exports = router;
