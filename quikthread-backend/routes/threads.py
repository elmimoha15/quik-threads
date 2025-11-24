from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from models.threads import ThreadGenerationRequest, ThreadGenerationResponse
from services.gemini_service import GeminiService
from middleware.auth import get_current_user
from config.settings import settings
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["threads"])

# Initialize Gemini service
gemini_service = GeminiService()

@router.post("/generate-threads", response_model=ThreadGenerationResponse)
async def generate_threads(
    request: ThreadGenerationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate viral X (Twitter) thread options from a transcript.
    
    This endpoint takes a transcript and generates 5 different viral thread options
    using Google Gemini AI. Each thread is optimized for engagement and follows
    X platform best practices.
    
    Args:
        request: ThreadGenerationRequest containing the transcript
        current_user: Authenticated user from Firebase token
        
    Returns:
        ThreadGenerationResponse with generated threads or error message
    """
    try:
        logger.info(f"Generating threads for user: {current_user.get('uid', 'unknown')}")
        
        # Validate transcript length
        if not request.transcript or len(request.transcript.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Transcript must be at least 10 characters long"
            )
        
        if len(request.transcript) > 50000:  # Reasonable limit for transcript length
            raise HTTPException(
                status_code=400,
                detail="Transcript is too long. Please provide a transcript under 50,000 characters."
            )
        
        # Generate threads using Gemini service
        result = await gemini_service.generate_threads(request.transcript)
        
        if not result["success"]:
            logger.error(f"Thread generation failed: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate threads: {result['error']}"
            )
        
        logger.info(f"Successfully generated {len(result['threads'])} threads")
        
        return ThreadGenerationResponse(
            success=True,
            threads=result["threads"],
            message="Successfully generated thread options"
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_threads: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating threads"
        )

@router.post("/generate-threads-test", response_model=ThreadGenerationResponse)
async def generate_threads_test(request: ThreadGenerationRequest):
    """
    Test endpoint for thread generation without authentication.
    FOR DEVELOPMENT/TESTING ONLY - Remove in production!
    
    Args:
        request: ThreadGenerationRequest containing the transcript
        
    Returns:
        ThreadGenerationResponse with generated threads or error message
    """
    try:
        logger.info("Testing thread generation (no auth)")
        
        # Validate transcript length
        if not request.transcript or len(request.transcript.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Transcript must be at least 10 characters long"
            )
        
        if len(request.transcript) > 50000:
            raise HTTPException(
                status_code=400,
                detail="Transcript is too long. Please provide a transcript under 50,000 characters."
            )
        
        # Generate threads using Gemini service
        result = await gemini_service.generate_threads(request.transcript)
        
        if not result["success"]:
            logger.error(f"Thread generation failed: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate threads: {result['error']}"
            )
        
        logger.info(f"Successfully generated {len(result['threads'])} threads")
        
        return ThreadGenerationResponse(
            success=True,
            threads=result["threads"],
            message="Successfully generated thread options (test mode)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in generate_threads_test: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating threads"
        )

@router.get("/threads/health")
async def threads_health():
    """
    Health check endpoint for threads service.
    
    Returns:
        JSON response indicating service status
    """
    try:
        # Check if Gemini service is properly configured
        if not settings.gemini_api_key:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "message": "Gemini API key not configured"
                }
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "status": "healthy",
                "message": "Threads service is operational",
                "service": "gemini"
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": f"Service error: {str(e)}"
            }
        )
