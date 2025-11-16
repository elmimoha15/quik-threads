const { getUserProfile } = require('../api/users');
const { db, getCurrentTime, addTimeToDate } = require('../config/firebase');

/**
 * Middleware to check user quota (credits usage)
 * Resets monthly quota if needed and validates current usage
 */
const checkQuota = async (req, res, next) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User authentication required'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User profile not found'
      });
    }

    const now = getCurrentTime();
    // Handle Firestore timestamp conversion
    const resetDate = userProfile.resetDate?.toDate ? userProfile.resetDate.toDate() : new Date(userProfile.resetDate);
    let updatedProfile = { ...userProfile };

    // Check if we need to reset monthly quota
    if (resetDate < now) {
      console.log(`Resetting quota for user ${userId}. Reset date was: ${resetDate}, now: ${now}`);
      
      // Calculate next reset date (first day of next month)
      const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      // Reset credits and update reset date
      updatedProfile = {
        ...userProfile,
        creditsUsed: 0,
        resetDate: nextResetDate,
        updatedAt: now
      };

      // Update in database
      await db.collection('users').doc(userId).update({
        creditsUsed: 0,
        resetDate: nextResetDate,
        updatedAt: now
      });

      console.log(`✅ Quota reset for user ${userId}. Next reset: ${nextResetDate}`);
    }

    // Check if user has exceeded their quota
    if (updatedProfile.creditsUsed >= updatedProfile.maxCredits) {
      const upgradeUrl = getUpgradeUrl(updatedProfile.tier);
      
      return res.status(429).json({
        error: 'Monthly limit reached',
        tier: updatedProfile.tier,
        maxCredits: updatedProfile.maxCredits,
        creditsUsed: updatedProfile.creditsUsed,
        resetDate: updatedProfile.resetDate,
        upgradeUrl,
        message: `You have reached your monthly limit of ${updatedProfile.maxCredits} credits. Your quota will reset on ${resetDate.toDateString()}. Upgrade your plan for more credits.`
      });
    }

    // Attach updated profile to request for downstream use
    req.userProfile = updatedProfile;
    
    // User has available credits, proceed
    next();

  } catch (error) {
    console.error('Error checking quota:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify quota'
    });
  }
};

/**
 * Helper function to increment user's credit usage
 * Call this after successful processing
 */
const incrementCredits = async (userId, amount = 1) => {
  try {
    const userRef = db.collection('users').doc(userId);
    
    // Use transaction to safely increment credits
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentCredits = userDoc.data().creditsUsed || 0;
      const newCredits = currentCredits + amount;

      transaction.update(userRef, {
        creditsUsed: newCredits,
        updatedAt: getCurrentTime()
      });
    });

    console.log(`✅ Incremented credits for user ${userId}: +${amount}`);
    return true;

  } catch (error) {
    console.error('Error incrementing credits:', error);
    throw error;
  }
};

/**
 * Helper function to get upgrade URL based on current tier
 */
const getUpgradeUrl = (currentTier) => {
  const baseUrl = 'https://quikthread.com/upgrade';
  
  switch (currentTier) {
    case 'free':
      return `${baseUrl}?from=free&to=pro`;
    case 'pro':
      return `${baseUrl}?from=pro&to=business`;
    case 'business':
      return `${baseUrl}?from=business&to=enterprise`;
    default:
      return baseUrl;
  }
};

/**
 * Helper function to check quota without middleware (for internal use)
 */
const checkUserQuota = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile) {
      return { hasQuota: false, error: 'User not found' };
    }

    const now = getCurrentTime();
    const resetDate = userProfile.resetDate?.toDate ? userProfile.resetDate.toDate() : new Date(userProfile.resetDate);
    let creditsUsed = userProfile.creditsUsed;

    // Reset if needed
    if (resetDate < now) {
      creditsUsed = 0;
    }

    const hasQuota = creditsUsed < userProfile.maxCredits;
    
    return {
      hasQuota,
      creditsUsed,
      maxCredits: userProfile.maxCredits,
      creditsRemaining: userProfile.maxCredits - creditsUsed,
      resetDate: userProfile.resetDate,
      tier: userProfile.tier
    };

  } catch (error) {
    console.error('Error checking user quota:', error);
    return { hasQuota: false, error: error.message };
  }
};

module.exports = {
  checkQuota,
  incrementCredits,
  checkUserQuota,
  getUpgradeUrl
};
