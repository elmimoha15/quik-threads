const express = require('express');
const { db } = require('../config/firebase');

const router = express.Router();

/**
 * Format job data for API response
 * @param {Object} jobDoc - Firestore job document
 * @returns {Object} Formatted job data
 */
const formatJobData = (jobDoc) => {
  const data = jobDoc.data();
  
  return {
    jobId: data.jobId,
    status: data.status,
    progress: data.progress || 0,
    currentStep: data.currentStep || '',
    type: data.type,
    fileUrl: data.fileUrl || null,
    contentUrl: data.contentUrl || null,
    
    // Timestamps
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
    failedAt: data.failedAt?.toDate?.()?.toISOString() || null,
    
    // Results (only if completed)
    threads: data.result?.threads || null,
    metadata: data.result?.metadata || null,
    transcription: data.result?.transcription || null,
    
    // Error information (only if failed)
    error: data.error || null,
    
    // Additional metadata
    storageFilePath: data.storageFilePath || null
  };
};

/**
 * GET /api/jobs/:jobId
 * Get specific job status by ID
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware
    
    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }
    
    // Get job document from Firestore
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
        error: 'Access denied. You can only view your own jobs.',
        jobId
      });
    }
    
    // Format and return job data
    const formattedJob = formatJobData(jobDoc);
    
    res.json({
      success: true,
      job: formattedJob
    });
    
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs
 * List user's jobs with pagination and sorting
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { limit = 50, offset = 0, status, type } = req.query;
    
    // Validate limit
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 jobs per request
    const offsetNum = parseInt(offset) || 0;
    
    // Build query
    let query = db.collection('jobs')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc');
    
    // Add status filter if provided
    if (status && ['processing', 'completed', 'failed'].includes(status)) {
      query = query.where('status', '==', status);
    }
    
    // Add type filter if provided
    if (type && ['upload', 'url'].includes(type)) {
      query = query.where('type', '==', type);
    }
    
    // Apply pagination
    if (offsetNum > 0) {
      // For offset-based pagination, we need to get and skip documents
      // This is not the most efficient for large datasets, but works for this use case
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
    
    // Format jobs data
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push(formatJobData(doc));
    });
    
    // Get total count for pagination metadata (optional, can be expensive)
    let totalCount = null;
    if (offsetNum === 0) { // Only get count on first page
      try {
        const countQuery = db.collection('jobs').where('userId', '==', userId);
        const countSnapshot = await countQuery.get();
        totalCount = countSnapshot.size;
      } catch (countError) {
        console.warn('Could not get total count:', countError.message);
      }
    }
    
    // Build response
    const response = {
      success: true,
      jobs,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: jobs.length,
        hasMore: jobs.length === limitNum
      }
    };
    
    if (totalCount !== null) {
      response.pagination.total = totalCount;
    }
    
    // Add filters info if applied
    if (status || type) {
      response.filters = {
        status: status || null,
        type: type || null
      };
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error listing jobs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs/stats
 * Get user's job statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    // Get all user jobs
    const snapshot = await db.collection('jobs')
      .where('userId', '==', userId)
      .get();
    
    // Calculate statistics
    const stats = {
      total: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {
        upload: 0,
        url: 0
      },
      totalThreadsGenerated: 0,
      totalProcessingTime: 0, // in seconds
      averageProcessingTime: 0
    };
    
    const processingTimes = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;
      
      // Count by status
      if (data.status) {
        stats[data.status] = (stats[data.status] || 0) + 1;
      }
      
      // Count by type
      if (data.type) {
        stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
      }
      
      // Count threads generated
      if (data.result?.threads) {
        stats.totalThreadsGenerated += data.result.threads.length;
      }
      
      // Calculate processing time for completed jobs
      if (data.status === 'completed' && data.createdAt && data.completedAt) {
        const startTime = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        const endTime = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
        const processingTime = (endTime - startTime) / 1000; // Convert to seconds
        processingTimes.push(processingTime);
        stats.totalProcessingTime += processingTime;
      }
    });
    
    // Calculate average processing time
    if (processingTimes.length > 0) {
      stats.averageProcessingTime = Math.round(stats.totalProcessingTime / processingTimes.length);
    }
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting job stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/jobs/:jobId
 * Delete a specific job (only if completed or failed)
 */
router.delete('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.userId; // From auth middleware
    
    if (!jobId) {
      return res.status(400).json({
        error: 'Job ID is required'
      });
    }
    
    // Get job document
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
        error: 'Access denied. You can only delete your own jobs.',
        jobId
      });
    }
    
    // Only allow deletion of completed or failed jobs
    if (jobData.status === 'processing') {
      return res.status(400).json({
        error: 'Cannot delete job that is still processing',
        jobId,
        status: jobData.status
      });
    }
    
    // Delete the job
    await jobRef.delete();
    
    res.json({
      success: true,
      message: 'Job deleted successfully',
      jobId
    });
    
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs/test
 * Test endpoint to verify jobs API is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Jobs API is working',
    timestamp: new Date().toISOString(),
    userId: req.userId || 'Not authenticated'
  });
});

module.exports = router;
