from deepgram import DeepgramClient
from config.settings import settings
from typing import Dict, Any
from utils.logger import log_error, log_event
import httpx

class DeepgramService:
    """Service for transcribing audio/video using Deepgram API"""
    
    def __init__(self):
        """Initialize Deepgram client with API key"""
        self.api_key = settings.deepgram_api_key
        self.base_url = "https://api.deepgram.com/v1/listen"
    
    async def transcribe_from_url(self, audio_url: str) -> Dict[str, Any]:
        """
        Transcribe audio/video from URL using Deepgram REST API
        
        Args:
            audio_url: URL to audio/video file
            
        Returns:
            Dict with transcript, duration, word_count, success, and optional error
        """
        try:
            # Configure Deepgram parameters
            params = {
                "model": "nova-2",
                "smart_format": "true",
                "punctuate": "true",
                "diarize": "true",
                "language": "en"
            }
            
            # Prepare headers
            headers = {
                "Authorization": f"Token {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Prepare request body with URL
            body = {
                "url": audio_url
            }
            
            # Make HTTP request to Deepgram API
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    self.base_url,
                    params=params,
                    headers=headers,
                    json=body
                )
                response.raise_for_status()
                result = response.json()
            
            # Extract transcript data from JSON response
            if result.get("results") and result["results"].get("channels"):
                channel = result["results"]["channels"][0]
                
                # Get full transcript
                transcript = ""
                if channel.get("alternatives"):
                    transcript = channel["alternatives"][0].get("transcript", "")
                
                # Calculate duration (in seconds)
                duration = 0
                if result.get("metadata") and result["metadata"].get("duration"):
                    duration = result["metadata"]["duration"]
                
                # Calculate word count
                word_count = len(transcript.split()) if transcript else 0
                
                return {
                    "transcript": transcript,
                    "duration": duration,
                    "word_count": word_count,
                    "success": True,
                    "error": None
                }
            else:
                return {
                    "transcript": "",
                    "duration": 0,
                    "word_count": 0,
                    "success": False,
                    "error": "No transcription results returned from Deepgram"
                }
                
        except Exception as e:
            # Log error with context
            log_error(e, {
                "service": "deepgram",
                "operation": "transcribe_from_url",
                "audio_url": audio_url
            })
            
            print(f"Deepgram transcription error: {e}")
            return {
                "transcript": "",
                "duration": 0,
                "word_count": 0,
                "success": False,
                "error": str(e)
            }

# Global service instance
deepgram_service = DeepgramService()
