from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth import get_current_user
from models.transcription import TranscriptionRequest, TranscriptionResponse
from services.deepgram_service import deepgram_service
from typing import Dict, Any

# Create router
router = APIRouter(prefix="/api", tags=["Transcription"])

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    request: TranscriptionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Transcribe audio/video from URL using Deepgram
    
    Requires authentication. Transcribes audio from the provided URL
    and returns transcript, duration, and word count.
    """
    try:
        # Call Deepgram service
        result = await deepgram_service.transcribe_from_url(request.audio_url)
        
        # Return response
        return TranscriptionResponse(**result)
        
    except Exception as e:
        print(f"Transcription endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )
