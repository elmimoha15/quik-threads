const express = require('express');
const { db, getTimestamp, getCurrentTime, addTimeToDate } = require('../config/firebase');
const { TIER_CONFIG } = require('../config/constants');

const router = express.Router();

/**
 * Helper function to get user profile from Firestore
 * @param {string} userId - Firebase user ID
 * @returns {Object|null} User profile or null if not found
 */
const getUserProfile = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Helper function to create a new user profile with default free tier
 * @param {string} userId - Firebase user ID
 * @param {string} email - User email
 * @returns {Object} Created user profile
 */
const createUserProfile = async (userId, email) => {
  try {
    const now = getCurrentTime();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
    
    const userProfile = {
      userId,
      email,
      tier: 'free',
      creditsUsed: 0,
      maxCredits: TIER_CONFIG.free.maxCredits,
      maxDuration: TIER_CONFIG.free.maxDuration,
      addonCredits: 0,
      resetDate,
      features: {
        analytics: TIER_CONFIG.free.analytics,
        postToX: TIER_CONFIG.free.postToX
      },
      createdAt: now,
      updatedAt: now
    };

    await db.collection('users').doc(userId).set({
      ...userProfile,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      resetDate: getTimestamp()
    });

    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * POST /api/users/init
 * Initialize user profile if it doesn't exist
 */
router.post('/init', async (req, res) => {
  try {
    const { userId, userEmail } = req;

    if (!userId || !userEmail) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User ID and email are required'
      });
    }

    // Check if user profile already exists
    const existingProfile = await getUserProfile(userId);
    
    if (existingProfile) {
      return res.status(200).json({
        message: 'User profile already exists',
        profile: existingProfile
      });
    }

    // Create new user profile
    const newProfile = await createUserProfile(userId, userEmail);

    res.status(201).json({
      message: 'User profile created successfully',
      profile: newProfile
    });

  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to initialize user profile'
    });
  }
});

/**
 * GET /api/users/profile
 * Get user profile (create if missing)
 */
router.get('/profile', async (req, res) => {
  try {
    const { userId, userEmail } = req;

    if (!userId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required'
      });
    }

    // Try to get existing profile
    let profile = await getUserProfile(userId);

    // If profile doesn't exist, create it
    if (!profile) {
      if (!userEmail) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email is required to create new profile'
        });
      }
      
      profile = await createUserProfile(userId, userEmail);
    }

    res.status(200).json({
      message: 'User profile retrieved successfully',
      profile
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
});

/**
 * GET /api/users/stats
 * Get user usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req;
    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    const stats = {
      tier: profile.tier,
      creditsUsed: profile.creditsUsed,
      maxCredits: profile.maxCredits,
      creditsRemaining: profile.maxCredits - profile.creditsUsed,
      resetDate: profile.resetDate,
      features: profile.features
    };

    res.status(200).json({
      message: 'User statistics retrieved successfully',
      stats
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user statistics'
    });
  }
});

/**
 * GET /api/users/usage
 * Get user usage data for frontend components
 */
router.get('/usage', async (req, res) => {
  try {
    const { userId, userEmail } = req;
    
    // Try to get existing profile
    let profile = await getUserProfile(userId);

    // If profile doesn't exist, create it
    if (!profile) {
      if (!userEmail) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email is required to create new profile'
        });
      }
      
      profile = await createUserProfile(userId, userEmail);
    }

    // Return usage data in the format expected by frontend
    const usageData = {
      currentUsage: profile.creditsUsed || 0,
      monthlyLimit: profile.maxCredits || TIER_CONFIG.free.maxCredits,
      addonCredits: profile.addonCredits || 0,
      tier: profile.tier || 'free',
      resetDate: profile.resetDate,
      features: profile.features || {
        analytics: TIER_CONFIG.free.analytics,
        postToX: TIER_CONFIG.free.postToX
      }
    };

    res.status(200).json(usageData);

  } catch (error) {
    console.error('Error getting user usage:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user usage data'
    });
  }
});

// Export router and helper functions
module.exports = {
  router,
  getUserProfile,
  createUserProfile
};
