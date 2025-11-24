"""
Test script for Analytics Dashboard
Tests feature access control and analytics functionality
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_analytics_health():
    """Test analytics service health"""
    print("\n" + "="*80)
    print("Testing Analytics Service Health")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/analytics/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.json().get('configured'):
        print("✅ Analytics service is configured")
    else:
        print("⚠️  Twitter API credentials not configured")

def test_analytics_without_auth():
    """Test analytics without authentication"""
    print("\n" + "="*80)
    print("Testing Analytics Without Authentication")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/analytics")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

def test_cache_clear_without_auth():
    """Test cache clearing without authentication"""
    print("\n" + "="*80)
    print("Testing Cache Clear Without Authentication")
    print("="*80)
    
    response = requests.delete(f"{BASE_URL}/api/analytics/cache")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

def test_feature_access_control():
    """Test feature access control for non-business tier users"""
    print("\n" + "="*80)
    print("Testing Feature Access Control")
    print("="*80)
    
    print("\nScenario 1: Free tier user tries to access analytics")
    print("Expected: 403 Forbidden with 'Upgrade to Business' message")
    
    print("\nScenario 2: Pro tier user tries to access analytics")
    print("Expected: 403 Forbidden with 'Upgrade to Business' message")
    
    print("\nScenario 3: Business tier user accesses analytics")
    print("Expected: 200 OK with analytics data")
    
    print("\nNote: This requires valid Firebase tokens from users with different tiers")
    print("The middleware will:")
    print("1. Verify authentication")
    print("2. Get user profile from Firestore")
    print("3. Check if features.analytics is true")
    print("4. Return 403 if false with upgrade message")

if __name__ == "__main__":
    print("\n" + "="*80)
    print("Analytics Dashboard Test")
    print("="*80)
    
    # Test health endpoint
    test_analytics_health()
    
    # Test without authentication
    test_analytics_without_auth()
    test_cache_clear_without_auth()
    
    # Test feature access control
    test_feature_access_control()
    
    print("\n" + "="*80)
    print("Feature Access Control Summary")
    print("="*80)
    print("\n📋 Tier Access:")
    print("  Free Tier:     ❌ Cannot access analytics")
    print("  Pro Tier:      ❌ Cannot access analytics")
    print("  Business Tier: ✅ Can access analytics")
    
    print("\n🔐 How it works:")
    print("1. User authenticates with Firebase token")
    print("2. check_feature_access('analytics') middleware:")
    print("   - Gets user profile from Firestore")
    print("   - Checks user.features.analytics")
    print("   - Returns 403 if false")
    print("3. If allowed, checks cache first (1 hour TTL)")
    print("4. If cache miss, fetches fresh analytics:")
    print("   - Queries /posts collection for user's posts")
    print("   - Fetches metrics from Twitter API")
    print("   - Calculates aggregated metrics")
    print("   - Caches results for 1 hour")
    
    print("\n📊 Analytics Metrics:")
    print("  - Total Impressions: Sum of all post impressions")
    print("  - Total Reach: Estimated unique views (70% of impressions)")
    print("  - Total Likes: Sum of all likes")
    print("  - Total Engagements: likes + retweets + replies + bookmarks")
    print("  - Week-over-Week Growth: % change in posts from last week")
    print("  - Posts This Week: Count of posts in last 7 days")
    print("  - Engagement Trend: Daily engagement for last 7 days")
    print("  - Top Posts: Top 5 posts by engagement")
    
    print("\n⚡ Caching:")
    print("  - Cache TTL: 1 hour")
    print("  - Cache location: Firestore /analytics-cache collection")
    print("  - Cache key: userId")
    print("  - Clear cache: DELETE /api/analytics/cache")
    
    print("\n📝 To test with real authentication:")
    print("1. Get Firebase ID token from frontend")
    print("2. Create test users with different tiers:")
    print("   - Free: features.analytics = false")
    print("   - Pro: features.analytics = false")
    print("   - Business: features.analytics = true")
    print("3. Test analytics access with each tier")
    print("4. Verify Free/Pro tiers get 403 with upgrade message")
    print("5. Verify Business tier gets analytics data")
    print("6. Make second request within 1 hour")
    print("7. Verify cached response (faster)")
    
    print("\n🐦 Twitter API Setup:")
    print("Analytics requires the same Twitter API credentials as posting")
    print("Make sure TWITTER_API_KEY, TWITTER_API_SECRET, etc. are in .env")
    
    print("\n" + "="*80)
    print("API Endpoints:")
    print("="*80)
    print("GET /api/analytics")
    print("  - Get analytics dashboard data (Business only)")
    print("  - Returns: AnalyticsData with metrics")
    print("  - Cached for 1 hour")
    print("\nDELETE /api/analytics/cache")
    print("  - Clear analytics cache (Business only)")
    print("  - Forces fresh calculation on next request")
    print("\nGET /api/analytics/health")
    print("  - Check analytics service status")
    print("="*80)
