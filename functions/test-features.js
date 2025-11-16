// Test script for feature access middleware
const { checkFeature } = require('./middleware/checkFeature');
const { getUserProfile, createUserProfile } = require('./api/users');
const { TIER_CONFIG } = require('./config/constants');

async function testFeatureAccess() {
  console.log('=== Testing Feature Access Middleware ===\n');

  try {
    // Create test users with different tiers
    const freeUserId = 'free-user-test';
    const proUserId = 'pro-user-test';
    const businessUserId = 'business-user-test';

    // Create free user
    await createUserProfile(freeUserId, 'free@test.com');
    console.log('✅ Free user created');

    // Create pro user (simulate tier upgrade)
    const proProfile = await createUserProfile(proUserId, 'pro@test.com');
    // Update to pro tier manually for testing
    const { db } = require('./config/firebase');
    await db.collection('users').doc(proUserId).update({
      tier: 'pro',
      maxCredits: TIER_CONFIG.pro.maxCredits,
      maxDuration: TIER_CONFIG.pro.maxDuration,
      features: {
        analytics: TIER_CONFIG.pro.analytics,
        postToX: TIER_CONFIG.pro.postToX
      }
    });
    console.log('✅ Pro user created');

    // Create business user
    await createUserProfile(businessUserId, 'business@test.com');
    await db.collection('users').doc(businessUserId).update({
      tier: 'business',
      maxCredits: TIER_CONFIG.business.maxCredits,
      maxDuration: TIER_CONFIG.business.maxDuration,
      features: {
        analytics: TIER_CONFIG.business.analytics,
        postToX: TIER_CONFIG.business.postToX
      }
    });
    console.log('✅ Business user created');

    // Test analytics feature access
    console.log('\n--- Testing Analytics Feature Access ---');
    
    // Test free user (should fail)
    const freeUser = await getUserProfile(freeUserId);
    const analyticsMiddleware = checkFeature('analytics');
    
    const mockReq = { userId: freeUserId };
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          if (code === 403) {
            console.log('✅ Free user blocked from analytics:', data.error);
          } else {
            console.log('❌ Free user should be blocked from analytics');
          }
        }
      })
    };

    await analyticsMiddleware(mockReq, mockRes, () => {
      console.log('❌ Free user should not reach next() for analytics');
    });

    // Test business user (should pass)
    const businessReq = { userId: businessUserId };
    let businessPassed = false;
    const businessRes = {
      status: (code) => ({
        json: (data) => console.log('❌ Business user should not be blocked:', data)
      })
    };

    await analyticsMiddleware(businessReq, businessRes, () => {
      businessPassed = true;
    });

    if (businessPassed) {
      console.log('✅ Business user has analytics access');
    }

    // Test postToX feature access
    console.log('\n--- Testing PostToX Feature Access ---');
    
    const postToXMiddleware = checkFeature('postToX');
    
    // Test free user (should fail)
    await postToXMiddleware(mockReq, {
      status: (code) => ({
        json: (data) => {
          if (code === 403) {
            console.log('✅ Free user blocked from postToX:', data.error);
          }
        }
      })
    }, () => {
      console.log('❌ Free user should not reach next() for postToX');
    });

    // Test pro user (should pass)
    const proReq = { userId: proUserId };
    let proPassed = false;
    await postToXMiddleware(proReq, {
      status: (code) => ({
        json: (data) => console.log('❌ Pro user should not be blocked:', data)
      })
    }, () => {
      proPassed = true;
    });

    if (proPassed) {
      console.log('✅ Pro user has postToX access');
    }

    console.log('\n=== Feature Access Tests Completed! ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testFeatureAccess();
