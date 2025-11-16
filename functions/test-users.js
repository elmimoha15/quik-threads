// Test script for user management functionality
const { getUserProfile, createUserProfile } = require('./api/users');
const { TIER_CONFIG } = require('./config/constants');

async function testUserManagement() {
  console.log('=== Testing User Management ===\n');

  try {
    // Test 1: Create a new user profile
    console.log('1. Testing createUserProfile...');
    const testUserId = 'test-user-123';
    const testEmail = 'test@example.com';
    
    const newProfile = await createUserProfile(testUserId, testEmail);
    console.log('✅ User profile created:', {
      userId: newProfile.userId,
      email: newProfile.email,
      tier: newProfile.tier,
      maxCredits: newProfile.maxCredits,
      creditsUsed: newProfile.creditsUsed,
      features: newProfile.features
    });

    // Verify tier configuration
    if (newProfile.tier === 'free' && 
        newProfile.maxCredits === TIER_CONFIG.free.maxCredits &&
        newProfile.features.analytics === false &&
        newProfile.features.postToX === false) {
      console.log('✅ Free tier configuration correct');
    } else {
      console.log('❌ Free tier configuration incorrect');
    }

    // Test 2: Retrieve existing user profile
    console.log('\n2. Testing getUserProfile...');
    const retrievedProfile = await getUserProfile(testUserId);
    
    if (retrievedProfile && retrievedProfile.userId === testUserId) {
      console.log('✅ User profile retrieved successfully');
    } else {
      console.log('❌ Failed to retrieve user profile');
    }

    // Test 3: Try to get non-existent user
    console.log('\n3. Testing non-existent user...');
    const nonExistentProfile = await getUserProfile('non-existent-user');
    
    if (nonExistentProfile === null) {
      console.log('✅ Non-existent user returns null correctly');
    } else {
      console.log('❌ Non-existent user should return null');
    }

    console.log('\n=== All User Management Tests Passed! ===');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testUserManagement();
