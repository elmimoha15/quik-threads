from pydantic import BaseModel, HttpUrl
from typing import Optional

class TranscriptionRequest(BaseModel):
    """Request model for transcription"""
    audio_url: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "audio_url": "https://storage.googleapis.com/your-bucket/audio-file.mp3"
            }
        }

class TranscriptionResponse(BaseModel):
    """Response model for transcription"""
    transcript: str
    duration: float
    word_count: int
    success: bool
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "Hello, this is a sample transcription of the audio file.",
                "duration": 45.2,
                "word_count": 12,
                "success": True,
                "error": None
            }
        }
