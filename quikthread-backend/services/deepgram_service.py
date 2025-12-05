from deepgram import DeepgramClient
from config.settings import settings
from typing import Dict, Any
from utils.logger import log_error, log_event
import httpx
import tempfile
import os
import yt_dlp

class DeepgramService:
    """Service for transcribing audio/video using Deepgram API"""
    
    def __init__(self):
        """Initialize Deepgram client with API key"""
        self.api_key = settings.deepgram_api_key
        self.base_url = "https://api.deepgram.com/v1/listen"
    
    def _is_youtube_url(self, url: str) -> bool:
        """Check if URL is from YouTube"""
        return 'youtube.com' in url or 'youtu.be' in url
    
    async def _download_youtube_audio(self, url: str) -> str:
        """
        Download YouTube audio to temporary file
        
        Args:
            url: YouTube URL
            
        Returns:
            Path to downloaded audio file
        """
        try:
            # Create temp directory if it doesn't exist
            temp_dir = tempfile.gettempdir()
            output_template = os.path.join(temp_dir, 'youtube_audio_%(id)s.%(ext)s')
            
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': output_template,
                'quiet': True,
                'no_warnings': True,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                video_id = info.get('id')
                filename = os.path.join(temp_dir, f'youtube_audio_{video_id}.mp3')
                
                if not os.path.exists(filename):
                    raise Exception(f"Downloaded file not found: {filename}")
                
                log_event("youtube_download_success", {
                    "url": url,
                    "video_id": video_id,
                    "file_size": os.path.getsize(filename)
                })
                
                return filename
                
        except Exception as e:
            log_error(e, {
                "service": "deepgram",
                "operation": "download_youtube_audio",
                "url": url
            })
            raise Exception(f"Failed to download YouTube audio: {str(e)}")
    
    async def transcribe_from_file(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio from local file using Deepgram
        
        Args:
            file_path: Path to local audio file
            
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
                "Content-Type": "audio/mpeg"
            }
            
            # Read audio file
            with open(file_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
            # Make HTTP request to Deepgram API
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    self.base_url,
                    params=params,
                    headers=headers,
                    content=audio_data
                )
                response.raise_for_status()
                result = response.json()
            
            # Clean up temp file
            try:
                os.remove(file_path)
            except:
                pass
            
            # Extract transcript data
            if result.get("results") and result["results"].get("channels"):
                channel = result["results"]["channels"][0]
                
                transcript = ""
                if channel.get("alternatives"):
                    transcript = channel["alternatives"][0].get("transcript", "")
                
                duration = 0
                if result.get("metadata") and result["metadata"].get("duration"):
                    duration = result["metadata"]["duration"]
                
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
            log_error(e, {
                "service": "deepgram",
                "operation": "transcribe_from_file",
                "file_path": file_path
            })
            
            # Clean up temp file on error
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except:
                pass
            
            return {
                "transcript": "",
                "duration": 0,
                "word_count": 0,
                "success": False,
                "error": str(e)
            }
    
    async def transcribe_from_url(self, audio_url: str) -> Dict[str, Any]:
        """
        Transcribe audio/video from URL using Deepgram REST API
        
        For YouTube URLs, downloads the audio first to avoid temporary URL expiration.
        For other URLs, sends the URL directly to Deepgram.
        
        Args:
            audio_url: URL to audio/video file
            
        Returns:
            Dict with transcript, duration, word_count, success, and optional error
        """
        try:
            # Special handling for YouTube URLs - download first
            if self._is_youtube_url(audio_url):
                log_event("youtube_transcription_start", {"url": audio_url})
                file_path = await self._download_youtube_audio(audio_url)
                return await self.transcribe_from_file(file_path)
            
            # For other URLs, use direct URL transcription
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
