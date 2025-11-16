const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, serverTimestamp } = require('../config/firebase');
const { getUserProfile } = require('./users');

const router = express.Router();

/**
 * POST /api/upload
 * Simplified upload endpoint for testing - creates a mock job
 */
router.post('/', async (req, res) => {
  try {
    const { userId, userEmail } = req;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Get user profile for validation
    let userProfile = await getUserProfile(userId);
    if (!userProfile) {
      // Create profile if it doesn't exist
      const { createUserProfile } = require('./users');
      userProfile = await createUserProfile(userId, userEmail);
    }

    // Generate job ID
    const jobId = uuidv4();

    // Create job document in Firestore
    const jobData = {
      jobId,
      userId,
      status: 'pending',
      progress: 0,
      currentStep: 'Queuing your request...',
      type: 'file',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await db.collection('jobs').doc(jobId).set(jobData);

    // Simulate processing stages
    setTimeout(async () => {
      await db.collection('jobs').doc(jobId).update({
        status: 'transcribing',
        progress: 50,
        currentStep: 'Extracting key points...',
        updatedAt: serverTimestamp()
      });
    }, 2000);

    setTimeout(async () => {
      await db.collection('jobs').doc(jobId).update({
        status: 'generating',
        progress: 75,
        currentStep: 'Crafting engaging tweets...',
        updatedAt: serverTimestamp()
      });
    }, 4000);

    setTimeout(async () => {
      // Create mock thread data
      const mockThreads = [
        {
          id: 1,
          text: "🚀 Just discovered an amazing way to transform long-form content into engaging Twitter threads!\n\nHere's what I learned:",
          order: 1
        },
        {
          id: 2,
          text: "1/ The key is breaking down complex ideas into bite-sized, digestible pieces.\n\nEach tweet should stand alone while contributing to the bigger narrative.",
          order: 2
        },
        {
          id: 3,
          text: "2/ Use hooks that grab attention immediately.\n\nStart with a bold statement, question, or surprising fact that makes people want to keep reading.",
          order: 3
        },
        {
          id: 4,
          text: "3/ Visual elements matter!\n\nEmojis, line breaks, and formatting help guide the reader's eye and make your content more scannable.",
          order: 4
        },
        {
          id: 5,
          text: "4/ End with a strong call-to-action.\n\nEncourage engagement, ask questions, or invite people to share their thoughts.",
          order: 5
        },
        {
          id: 6,
          text: "That's it! 🎯\n\nWhat's your favorite tip for creating engaging Twitter threads? Drop a comment below! 👇",
          order: 6
        }
      ];

      await db.collection('jobs').doc(jobId).update({
        status: 'completed',
        progress: 100,
        currentStep: 'Complete!',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        result: {
          threads: mockThreads,
          metadata: {
            totalTweets: mockThreads.length,
            estimatedReadTime: '2 minutes',
            generatedAt: new Date().toISOString()
          }
        }
      });

      // Increment user credits
      await db.collection('users').doc(userId).update({
        creditsUsed: db.FieldValue.increment(1),
        updatedAt: serverTimestamp()
      });
    }, 6000);

    res.status(200).json({
      jobId,
      status: 'pending',
      message: 'Upload successful, processing started'
    });

  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to process upload request'
    });
  }
});

module.exports = { router };
