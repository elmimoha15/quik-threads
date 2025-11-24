"""
Test script for Twitter/X posting feature
Tests feature access control and posting functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_twitter_health():
    """Test Twitter service health"""
    print("\n" + "="*80)
    print("Testing Twitter Service Health")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/twitter/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.json().get('configured'):
        print("✅ Twitter API is configured")
    else:
        print("⚠️  Twitter API credentials not configured")

def test_post_without_auth():
    """Test posting without authentication"""
    print("\n" + "="*80)
    print("Testing Post Without Authentication")
    print("="*80)
    
    payload = {
        "jobId": "job_test123",
        "threadIndex": 0
    }
    
    response = requests.post(
        f"{BASE_URL}/api/twitter/post",
        json=payload
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

def test_get_posts_without_auth():
    """Test getting posts without authentication"""
    print("\n" + "="*80)
    print("Testing Get Posts Without Authentication")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/twitter/posts")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

def test_feature_access_control():
    """Test feature access control for free tier users"""
    print("\n" + "="*80)
    print("Testing Feature Access Control")
    print("="*80)
    
    print("\nScenario: Free tier user tries to post to X")
    print("Expected: 403 Forbidden with upgrade message")
    print("\nNote: This requires a valid Firebase token from a free tier user")
    print("The middleware will:")
    print("1. Verify authentication")
    print("2. Get user profile from Firestore")
    print("3. Check if features.postToX is true")
    print("4. Return 403 if false with upgrade message")

if __name__ == "__main__":
    print("\n" + "="*80)
    print("Twitter/X Posting Feature Test")
    print("="*80)
    
    # Test health endpoint
    test_twitter_health()
    
    # Test without authentication
    test_post_without_auth()
    test_get_posts_without_auth()
    
    # Test feature access control
    test_feature_access_control()
    
    print("\n" + "="*80)
    print("Feature Access Control Summary")
    print("="*80)
    print("\n📋 Tier Access:")
    print("  Free Tier:     ❌ Cannot post to X")
    print("  Pro Tier:      ✅ Can post to X")
    print("  Business Tier: ✅ Can post to X + Analytics")
    
    print("\n🔐 How it works:")
    print("1. User authenticates with Firebase token")
    print("2. check_feature_access('postToX') middleware:")
    print("   - Gets user profile from Firestore")
    print("   - Checks user.features.postToX")
    print("   - Returns 403 if false")
    print("3. If allowed, posts thread to X")
    print("4. Saves post record to /posts collection")
    
    print("\n📝 To test with real authentication:")
    print("1. Get Firebase ID token from frontend")
    print("2. Create test users with different tiers:")
    print("   - Free: features.postToX = false")
    print("   - Pro: features.postToX = true")
    print("3. Test posting with each tier")
    print("4. Verify free tier gets 403 with upgrade message")
    print("5. Verify pro tier successfully posts thread")
    
    print("\n🐦 Twitter API Setup:")
    print("1. Go to https://developer.twitter.com/")
    print("2. Create app and get API credentials")
    print("3. Add to .env:")
    print("   TWITTER_API_KEY=your_api_key")
    print("   TWITTER_API_SECRET=your_api_secret")
    print("   TWITTER_ACCESS_TOKEN=your_access_token")
    print("   TWITTER_ACCESS_SECRET=your_access_secret")
    print("4. Restart server")
    
    print("\n" + "="*80)
    print("API Endpoints:")
    print("="*80)
    print("POST /api/twitter/post")
    print("  - Post thread to X (Pro/Business only)")
    print("  - Body: {jobId, threadIndex}")
    print("  - Returns: {threadUrl, tweetIds, postId}")
    print("\nGET /api/twitter/posts")
    print("  - Get user's posted threads (Pro/Business only)")
    print("  - Returns: List of posts")
    print("\nGET /api/twitter/health")
    print("  - Check Twitter service status")
    print("="*80)
