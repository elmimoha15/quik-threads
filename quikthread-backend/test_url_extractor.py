"""
Test script for URL extractor service
Tests YouTube URL extraction functionality
"""
import asyncio
from services.url_extractor_service import UrlExtractorService

async def test_youtube_url():
    """Test YouTube URL extraction"""
    service = UrlExtractorService()
    
    # Test URL from user
    test_url = "https://youtu.be/9CUzYbtCH6U?si=UzvpoV-_b3h7rB-y"
    
    print(f"Testing URL extraction for: {test_url}")
    print("-" * 80)
    
    result = await service.extract_media_url(test_url)
    
    print(f"Success: {result['success']}")
    
    if result['success']:
        print(f"Platform: {result.get('platform', 'unknown')}")
        print(f"Title: {result.get('title', 'N/A')}")
        print(f"Duration: {result.get('duration', 'N/A')} seconds")
        print(f"Original URL: {result.get('original_url', 'N/A')}")
        print(f"Extracted URL: {result.get('url', 'N/A')[:100]}...")
    else:
        print(f"Error: {result.get('error', 'Unknown error')}")
    
    print("-" * 80)

if __name__ == "__main__":
    asyncio.run(test_youtube_url())
