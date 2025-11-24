"""
Test script for File Upload Endpoint
Tests file upload with tier-based duration validation
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_upload_health():
    """Test upload service health"""
    print("\n" + "="*80)
    print("Testing Upload Service Health")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/upload/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("✅ Upload service is healthy")
    else:
        print("❌ Upload service is not healthy")

def test_upload_without_auth():
    """Test upload without authentication"""
    print("\n" + "="*80)
    print("Testing Upload Without Authentication")
    print("="*80)
    
    # Try to upload without auth token
    response = requests.post(f"{BASE_URL}/api/upload")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

def test_get_upload_limits_without_auth():
    """Test getting upload limits without authentication"""
    print("\n" + "="*80)
    print("Testing Get Upload Limits Without Authentication")
    print("="*80)
    
    response = requests.get(f"{BASE_URL}/api/upload/limits")
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 403:
        print("✅ Correctly rejected - authentication required")
    else:
        print("❌ Should require authentication")

if __name__ == "__main__":
    print("\n" + "="*80)
    print("File Upload Endpoint Test")
    print("="*80)
    
    # Test health endpoint
    test_upload_health()
    
    # Test without authentication
    test_upload_without_auth()
    test_get_upload_limits_without_auth()
    
    print("\n" + "="*80)
    print("Upload Validation Summary")
    print("="*80)
    print("\n📋 File Type Validation:")
    print("  Allowed formats: mp3, mp4, m4a, wav, webm, mpeg, mpga, avi, mov")
    print("  Validation: File extension + MIME type")
    
    print("\n📏 File Size Validation:")
    print("  Minimum: 1 MB")
    print("  Maximum: 500 MB")
    
    print("\n⏱️  Duration Validation (Tier-based):")
    print("  Free Tier:     Max 30 minutes (1800 seconds)")
    print("  Pro Tier:      Max 60 minutes (3600 seconds)")
    print("  Business Tier: Max 60 minutes (3600 seconds)")
    
    print("\n🔐 How it works:")
    print("1. User authenticates with Firebase token")
    print("2. File type validated (extension + MIME type)")
    print("3. File size validated (1MB - 500MB)")
    print("4. Audio duration extracted using ffprobe")
    print("5. Duration validated against user's tier limit:")
    print("   - Free: Reject if > 30 minutes")
    print("   - Pro/Business: Reject if > 60 minutes")
    print("6. If valid, upload to Firebase Storage")
    print("7. Generate signed URL (valid for 2 hours)")
    print("8. Return fileUrl, fileName, size, duration")
    
    print("\n📤 Upload Flow:")
    print("  POST /api/upload")
    print("    - Requires: multipart/form-data with 'file' field")
    print("    - Headers: Authorization: Bearer <firebase_token>")
    print("    - Returns: {fileUrl, fileName, size, duration}")
    
    print("\n📊 Error Responses:")
    print("\n  Free user uploads 31-minute file:")
    print("  {")
    print('    "message": "Audio duration (31.0 minutes) exceeds your plan limit (30 minutes)..."')
    print('    "duration": 1860,')
    print('    "maxDuration": 1800,')
    print('    "currentTier": "free",')
    print('    "requiredTier": "pro",')
    print('    "upgradeUrl": "https://quikthread.com/pricing"')
    print("  }")
    
    print("\n  Invalid file type:")
    print("  {")
    print('    "message": "Invalid file type. Supported formats: mp3, mp4, m4a, wav, webm"')
    print('    "allowedFormats": ["mp3", "mp4", "m4a", "wav", "webm"]')
    print("  }")
    
    print("\n  File too large:")
    print("  {")
    print('    "message": "File too large. Maximum size is 500MB"')
    print("  }")
    
    print("\n📁 Firebase Storage Structure:")
    print("  /users/{userId}/uploads/{timestamp}_{filename}")
    print("  Example: /users/user123/uploads/a1b2c3d4_podcast.mp3")
    
    print("\n🔗 Signed URLs:")
    print("  - Valid for 2 hours")
    print("  - Used for Deepgram transcription")
    print("  - Automatically expires for security")
    
    print("\n📝 To test with real files:")
    print("1. Get Firebase ID token from frontend")
    print("2. Create test audio files:")
    print("   - Free tier: 20-minute file (should succeed)")
    print("   - Free tier: 31-minute file (should fail)")
    print("   - Pro tier: 55-minute file (should succeed)")
    print("3. Upload using curl:")
    print("   curl -X POST http://localhost:8000/api/upload \\")
    print("     -H 'Authorization: Bearer <token>' \\")
    print("     -F 'file=@test_audio.mp3'")
    print("4. Verify response contains fileUrl and duration")
    print("5. Check Firebase Storage console for uploaded file")
    
    print("\n" + "="*80)
    print("API Endpoints:")
    print("="*80)
    print("POST /api/upload")
    print("  - Upload audio/video file")
    print("  - Validates type, size, and duration")
    print("  - Returns: {fileUrl, fileName, size, duration}")
    print("\nGET /api/upload/limits")
    print("  - Get upload limits for current user")
    print("  - Returns: {maxDuration, maxFileSize, allowedFormats, tier}")
    print("\nGET /api/upload/health")
    print("  - Check upload service status")
    print("="*80)
