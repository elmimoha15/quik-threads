from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from models.job import ProcessRequest, JobStatus
from services.job_service import JobService
from services.deepgram_service import DeepgramService
from services.gemini_service import GeminiService
from services.url_extractor_service import UrlExtractorService
from middleware.auth import get_current_user
from middleware.check_quota import check_user_quota
from typing import List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["process"])

# Initialize services
job_service = JobService()
deepgram_service = DeepgramService()
gemini_service = GeminiService()
url_extractor_service = UrlExtractorService()

async def process_job_background(job_id: str, request: ProcessRequest, user_id: str):
    """
    Background task to process the job: transcribe → generate threads
    
    Args:
        job_id: Job ID to process
        request: Process request data
        user_id: User ID who created the job
    """
    try:
        # Determine the URL to use
        audio_url = request.fileUrl if request.type == "upload" else request.contentUrl
        
        if not audio_url:
            await job_service.fail_job(job_id, "No audio URL provided")
            return
        
        # Step 0: Extract direct media URL if needed (only for non-YouTube URLs)
        # YouTube URLs are handled directly by DeepgramService with download-first approach
        if request.type == "url" and not url_extractor_service.is_social_media_url(audio_url):
            logger.info(f"Job {job_id}: Checking if URL extraction needed for {audio_url}")
            
            # Only extract if it's not a direct media URL
            if not url_extractor_service.is_direct_media_url(audio_url):
                await job_service.update_job_progress(job_id, 10, "processing")
                
                extraction_result = await url_extractor_service.extract_media_url(audio_url)
                
                if not extraction_result["success"]:
                    await job_service.fail_job(job_id, f"URL extraction failed: {extraction_result['error']}")
                    return
                
                audio_url = extraction_result["url"]
                logger.info(f"Job {job_id}: Extracted media URL")
        
        # For YouTube/social media URLs, log that we're using direct processing
        if url_extractor_service.is_social_media_url(audio_url):
            logger.info(f"Job {job_id}: Processing social media URL directly (download-first approach)")
        
        # Step 1: Transcribe audio (25% → 75%)
        logger.info(f"Job {job_id}: Starting transcription")
        await job_service.update_job_progress(job_id, 25, "transcribing")
        
        transcription_result = await deepgram_service.transcribe_from_url(audio_url)
        
        if not transcription_result["success"]:
            await job_service.fail_job(job_id, f"Transcription failed: {transcription_result['error']}")
            return
        
        transcript = transcription_result["transcript"]
        duration = transcription_result.get("duration")
        
        logger.info(f"Job {job_id}: Transcription completed, duration: {duration}s")
        
        # Step 2: Generate X posts by format (75% → 100%)
        logger.info(f"Job {job_id}: Starting X post generation")
        await job_service.update_job_progress(job_id, 75, "generating")
        
        # Get AI instructions from request data
        ai_instructions = request.aiInstructions if hasattr(request, 'aiInstructions') else None
        
        posts_result = await gemini_service.generate_threads(transcript, ai_instructions)
        
        if not posts_result["success"]:
            await job_service.fail_job(job_id, f"X post generation failed: {posts_result['error']}")
            return
        
        posts = posts_result["posts"]
        
        logger.info(f"Job {job_id}: Generated posts in {len(posts)} formats")
        
        # Step 3: Complete job
        await job_service.complete_job(job_id, posts, duration)
        logger.info(f"Job {job_id}: Completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id}: Unexpected error: {str(e)}")
        await job_service.fail_job(job_id, f"Processing error: {str(e)}")

@router.post("/process")
async def process_audio(
    request: ProcessRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(check_user_quota)
):
    """
    Process audio/video: upload → transcribe → generate threads
    
    This endpoint creates a job and processes it in the background.
    Use GET /api/jobs/{jobId} to poll for status and results.
    
    Quota is automatically checked via the check_user_quota middleware.
    
    Args:
        request: ProcessRequest with type and URL
        background_tasks: FastAPI background tasks
        user_id: User ID from quota check (includes auth + quota validation)
        
    Returns:
        Job ID for tracking progress
    """
    try:
        
        # Validate request
        if request.type == "upload" and not request.fileUrl:
            raise HTTPException(
                status_code=400,
                detail="fileUrl is required for upload type"
            )
        
        if request.type == "url" and not request.contentUrl:
            raise HTTPException(
                status_code=400,
                detail="contentUrl is required for url type"
            )
        
        # Create job
        job_id = await job_service.create_job(user_id, request.dict())
        
        # Start background processing
        background_tasks.add_task(process_job_background, job_id, request, user_id)
        
        logger.info(f"Created job {job_id} for user {user_id}")
        
        return JSONResponse(
            status_code=202,
            content={
                "success": True,
                "jobId": job_id,
                "message": "Job created and processing started"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create processing job"
        )

@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get job status and results
    
    Args:
        job_id: Job ID to retrieve
        current_user: Authenticated user
        
    Returns:
        JobStatus with current progress and results
    """
    try:
        user_id = current_user.get('uid')
        
        # Get job
        job_data = await job_service.get_job(job_id)
        
        if not job_data:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        # Verify job belongs to user
        if job_data.get('userId') != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Job belongs to another user"
            )
        
        # Return job status
        return JobStatus(**job_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve job status"
        )

@router.get("/jobs")
async def get_user_jobs(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get all jobs for current user
    
    Args:
        current_user: Authenticated user
        
    Returns:
        List of JobStatus objects
    """
    try:
        user_id = current_user.get('uid')
        
        # Get user's jobs
        jobs = await job_service.get_user_jobs(user_id, limit=50)
        
        # Convert to JobStatus models
        job_statuses = [JobStatus(**job) for job in jobs]
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "jobs": [job.dict() for job in job_statuses],
                "count": len(job_statuses)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting user jobs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve jobs"
        )
