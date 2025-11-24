import yt_dlp
from typing import Dict, Any, Optional
from utils.logger import log_error, log_event
import re

class UrlExtractorService:
    """Service for extracting direct media URLs from social media platforms"""
    
    def __init__(self):
        """Initialize URL extractor with yt-dlp configuration"""
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True,
        }
    
    def is_social_media_url(self, url: str) -> bool:
        """
        Check if URL is from a social media platform that needs extraction
        
        Args:
            url: URL to check
            
        Returns:
            True if URL needs extraction, False otherwise
        """
        social_patterns = [
            r'(youtube\.com|youtu\.be)',
            r'tiktok\.com',
            r'instagram\.com',
            r'twitter\.com|x\.com',
            r'facebook\.com|fb\.watch',
            r'vimeo\.com',
            r'twitch\.tv',
        ]
        
        for pattern in social_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return True
        return False
    
    def is_direct_media_url(self, url: str) -> bool:
        """
        Check if URL is a direct media file
        
        Args:
            url: URL to check
            
        Returns:
            True if URL is direct media, False otherwise
        """
        media_extensions = ['.mp3', '.mp4', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.mov', '.avi', '.flac']
        url_lower = url.lower()
        return any(url_lower.endswith(ext) for ext in media_extensions)
    
    async def extract_media_url(self, url: str) -> Dict[str, Any]:
        """
        Extract direct media URL from social media platforms using yt-dlp
        
        Args:
            url: Social media URL to extract from
            
        Returns:
            Dict with success status, extracted URL, title, duration, and optional error
        """
        try:
            # If it's already a direct media URL, return it as-is
            if self.is_direct_media_url(url):
                return {
                    "success": True,
                    "url": url,
                    "original_url": url,
                    "title": "Direct Media",
                    "duration": None,
                    "platform": "direct"
                }
            
            # If it's not a social media URL, try to use it directly
            if not self.is_social_media_url(url):
                return {
                    "success": True,
                    "url": url,
                    "original_url": url,
                    "title": "Web Media",
                    "duration": None,
                    "platform": "web"
                }
            
            # Extract info using yt-dlp
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    return {
                        "success": False,
                        "error": "Failed to extract media information",
                        "original_url": url
                    }
                
                # Get the best audio URL
                media_url = info.get('url')
                
                # For some platforms, we might need to get it from formats
                if not media_url and 'formats' in info:
                    # Find best audio format
                    audio_formats = [f for f in info['formats'] if f.get('acodec') != 'none']
                    if audio_formats:
                        # Sort by quality and get best
                        best_format = max(audio_formats, key=lambda f: f.get('abr', 0) or 0)
                        media_url = best_format.get('url')
                
                if not media_url:
                    return {
                        "success": False,
                        "error": "Could not find suitable audio stream",
                        "original_url": url
                    }
                
                # Extract metadata
                title = info.get('title', 'Unknown')
                duration = info.get('duration')
                platform = info.get('extractor_key', 'unknown').lower()
                
                log_event("url_extraction_success", {
                    "original_url": url,
                    "platform": platform,
                    "title": title,
                    "duration": duration
                })
                
                return {
                    "success": True,
                    "url": media_url,
                    "original_url": url,
                    "title": title,
                    "duration": duration,
                    "platform": platform
                }
                
        except yt_dlp.utils.DownloadError as e:
            error_msg = str(e)
            log_error(e, {
                "service": "url_extractor",
                "operation": "extract_media_url",
                "url": url,
                "error_type": "download_error"
            })
            
            return {
                "success": False,
                "error": f"Failed to extract media: {error_msg}",
                "original_url": url
            }
            
        except Exception as e:
            log_error(e, {
                "service": "url_extractor",
                "operation": "extract_media_url",
                "url": url
            })
            
            return {
                "success": False,
                "error": f"Unexpected error during URL extraction: {str(e)}",
                "original_url": url
            }

# Global service instance
url_extractor_service = UrlExtractorService()
