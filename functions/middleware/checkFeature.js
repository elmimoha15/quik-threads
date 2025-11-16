const { getUserProfile } = require('../api/users');

/**
 * Middleware factory to check if user has access to a specific feature
 * @param {string} featureName - Name of the feature to check (e.g., 'analytics', 'postToX')
 * @returns {Function} Express middleware function
 */
const checkFeature = (featureName) => {
  return async (req, res, next) => {
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

      // Check if user has access to the feature
      const hasFeatureAccess = userProfile.features && userProfile.features[featureName] === true;

      if (!hasFeatureAccess) {
        return res.status(403).json({
          error: 'Upgrade to Pro/Business for this feature',
          feature: featureName,
          currentTier: userProfile.tier,
          message: `The '${featureName}' feature is not available on your current ${userProfile.tier} plan. Please upgrade to Pro or Business to access this feature.`
        });
      }

      // User has access, continue to next middleware/handler
      next();

    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify feature access'
      });
    }
  };
};

/**
 * Helper function to check multiple features at once
 * @param {string[]} featureNames - Array of feature names to check
 * @returns {Function} Express middleware function
 */
const checkMultipleFeatures = (featureNames) => {
  return async (req, res, next) => {
    try {
      const { userId } = req;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      const userProfile = await getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({
          error: 'User Not Found',
          message: 'User profile not found'
        });
      }

      // Check all required features
      const missingFeatures = featureNames.filter(feature => 
        !userProfile.features || userProfile.features[feature] !== true
      );

      if (missingFeatures.length > 0) {
        return res.status(403).json({
          error: 'Upgrade to Pro/Business for these features',
          features: missingFeatures,
          currentTier: userProfile.tier,
          message: `The following features are not available on your current ${userProfile.tier} plan: ${missingFeatures.join(', ')}. Please upgrade to Pro or Business.`
        });
      }

      next();

    } catch (error) {
      console.error('Error checking multiple feature access:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to verify feature access'
      });
    }
  };
};

module.exports = {
  checkFeature,
  checkMultipleFeatures
};
