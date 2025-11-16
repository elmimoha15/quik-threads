// Test script for quota checking middleware
const { checkQuota, incrementCredits, checkUserQuota } = require('./middleware/checkQuota');
const { getUserProfile, createUserProfile } = require('./api/users');
const { db } = require('./config/firebase');

async function testQuotaSystem() {
  console.log('=== Testing Quota System ===\n');

  try {
    // Create test user
    const testUserId = 'quota-test-user';
    const testEmail = 'quota@test.com';
    
    await createUserProfile(testUserId, testEmail);
    console.log('✅ Test user created');

    // Test 1: Normal quota check (should pass)
    console.log('\n1. Testing normal quota check...');
    const quotaMiddleware = checkQuota;
    
    const mockReq = { userId: testUserId };
    let quotaPassed = false;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Quota check failed with ${code}:`, data.error);
        }
      })
    };

    await quotaMiddleware(mockReq, mockRes, () => {
      quotaPassed = true;
      console.log('✅ Quota check passed - user has available credits');
    });

    // Test 2: Set user to max credits and test quota limit
    console.log('\n2. Testing quota limit (creditsUsed = maxCredits)...');
    
    // Update user to have used all credits
    await db.collection('users').doc(testUserId).update({
      creditsUsed: 2 // Free tier max credits
    });
    console.log('✅ Set user credits to maximum (2/2)');

    // Test quota check again (should fail with 429)
    const mockReq2 = { userId: testUserId };
    let quotaBlocked = false;
    const mockRes2 = {
      status: (code) => ({
        json: (data) => {
          if (code === 429) {
            quotaBlocked = true;
            console.log('✅ Quota limit reached - 429 error:', data.error);
            console.log('   Tier:', data.tier);
            console.log('   Max Credits:', data.maxCredits);
            console.log('   Credits Used:', data.creditsUsed);
            console.log('   Upgrade URL:', data.upgradeUrl);
          } else {
            console.log(`❌ Expected 429, got ${code}:`, data);
          }
        }
      })
    };

    await quotaMiddleware(mockReq2, mockRes2, () => {
      console.log('❌ Should not pass when quota exceeded');
    });

    if (quotaBlocked) {
      console.log('✅ Quota blocking works correctly');
    }

    // Test 3: Test monthly reset functionality
    console.log('\n3. Testing monthly reset...');
    
    // Set reset date to past date to trigger reset
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);
    
    await db.collection('users').doc(testUserId).update({
      resetDate: pastDate
    });
    console.log('✅ Set reset date to past month');

    // Test quota check (should reset and pass)
    const mockReq3 = { userId: testUserId };
    let resetWorked = false;
    const mockRes3 = {
      status: (code) => ({
        json: (data) => console.log(`❌ Reset failed with ${code}:`, data)
      })
    };

    await quotaMiddleware(mockReq3, mockRes3, () => {
      resetWorked = true;
      console.log('✅ Monthly reset worked - quota available again');
    });

    // Test 4: Test increment credits function
    console.log('\n4. Testing credit increment...');
    
    const beforeProfile = await getUserProfile(testUserId);
    console.log('Credits before increment:', beforeProfile.creditsUsed);
    
    await incrementCredits(testUserId, 1);
    
    const afterProfile = await getUserProfile(testUserId);
    console.log('Credits after increment:', afterProfile.creditsUsed);
    
    if (afterProfile.creditsUsed === beforeProfile.creditsUsed + 1) {
      console.log('✅ Credit increment works correctly');
    } else {
      console.log('❌ Credit increment failed');
    }

    // Test 5: Test checkUserQuota helper
    console.log('\n5. Testing quota helper function...');
    
    const quotaStatus = await checkUserQuota(testUserId);
    console.log('Quota status:', {
      hasQuota: quotaStatus.hasQuota,
      creditsUsed: quotaStatus.creditsUsed,
      maxCredits: quotaStatus.maxCredits,
      creditsRemaining: quotaStatus.creditsRemaining,
      tier: quotaStatus.tier
    });

    console.log('\n=== Quota System Tests Completed! ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testQuotaSystem();
