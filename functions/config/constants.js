// Tier configuration for QuikThread SaaS
const TIER_CONFIG = {
  free: { 
    maxCredits: 2, 
    maxDuration: 1800, // 30 minutes in seconds
    analytics: false, 
    postToX: false 
  },
  pro: { 
    maxCredits: 30, 
    maxDuration: 3600, // 60 minutes in seconds
    analytics: false, 
    postToX: true 
  },
  business: { 
    maxCredits: 100, 
    maxDuration: 3600, // 60 minutes in seconds
    analytics: true, 
    postToX: true 
  }
};

// Plan pricing (monthly)
const PLAN_PRICING = {
  free: 0,
  pro: 20,
  business: 49
};

// Feature names for easy reference
const FEATURES = {
  ANALYTICS: 'analytics',
  POST_TO_X: 'postToX'
};

module.exports = {
  TIER_CONFIG,
  PLAN_PRICING,
  FEATURES
};
