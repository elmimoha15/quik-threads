from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from services.storage_service import StorageService
from services.user_service import UserService
from middleware.auth import get_current_user
from typing import Dict, Any
import logging
from utils.logger import log_error, log_event

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/upload", tags=["upload"])

# Initialize services
storage_service = StorageService()
user_service = UserService()

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload audio/video file to Firebase Storage
    
    This endpoint handles direct file uploads with validation for:
    - File type (mp3, mp4, m4a, wav, webm only)
    - File size (1MB min, 500MB max)
    - Duration based on user tier:
      - Free: max 30 minutes (1800 seconds)
      - Pro/Business: max 60 minutes (3600 seconds)
    
    Args:
        file: Uploaded file
        current_user: Authenticated user from middleware
        
    Returns:
        Upload response with fileUrl, fileName, size, and duration
    """
    try:
        user_id = current_user.get('uid')
        email = current_user.get('email', 'unknown@example.com')
        
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="User ID not found in authentication token"
            )
        
        # Get user profile to check tier limits
        user_profile = await user_service.get_or_create_user(user_id, email)
        max_duration = user_profile.get('maxDuration', 1800)  # Default to 30 min
        tier = user_profile.get('tier', 'free')
        
        logger.info(f"Upload request from user {user_id} (tier: {tier}, max: {max_duration}s)")
        
        # Validate file type
        if not storage_service.validate_file_type(file.filename, file.content_type):
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Invalid file type. Supported formats: mp3, mp4, m4a, wav, webm",
                    "allowedFormats": ["mp3", "mp4", "m4a", "wav", "webm"]
                }
            )
        
        # Get file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        # Validate file size
        size_validation = storage_service.validate_file_size(file_size)
        if not size_validation.get('valid'):
            raise HTTPException(
                status_code=400,
                detail=size_validation.get('error')
            )
        
        # Extract audio duration
        duration = await storage_service.get_audio_duration(file)
        
        if duration is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to extract audio duration. File may be corrupted or invalid."
            )
        
        # Validate duration against user's tier limit
        if duration > max_duration:
            # Determine required tier for upgrade message
            if tier == 'free':
                required_tier = 'pro'
                upgrade_message = (
                    f"Audio duration ({duration/60:.1f} minutes) exceeds your plan limit "
                    f"({max_duration/60:.0f} minutes). Upgrade to Pro for up to 60-minute files."
                )
            else:
                # Pro/Business tier already has max duration
                required_tier = tier
                upgrade_message = (
                    f"Audio duration ({duration/60:.1f} minutes) exceeds the maximum limit "
                    f"({max_duration/60:.0f} minutes)."
                )
            
            logger.warning(f"Duration exceeded for user {user_id}: {duration}s > {max_duration}s")
            
            raise HTTPException(
                status_code=400,
                detail={
                    "message": upgrade_message,
                    "duration": duration,
                    "maxDuration": max_duration,
                    "currentTier": tier,
                    "requiredTier": required_tier,
                    "upgradeUrl": "https://quikthread.com/pricing"
                }
            )
        
        # Upload file to Firebase Storage
        upload_result = await storage_service.upload_file(user_id, file, file.filename)
        
        if not upload_result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload file: {upload_result.get('error')}"
            )
        
        # Log successful upload event
        log_event("file_upload_success", {
            "user_id": user_id,
            "filename": file.filename,
            "size": file_size,
            "duration": duration,
            "tier": tier
        })
        
        logger.info(f"Upload successful: {file.filename} ({file_size} bytes, {duration}s)")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "fileUrl": upload_result.get('fileUrl'),
                "fileName": upload_result.get('fileName'),
                "size": file_size,
                "duration": duration,
                "message": "File uploaded successfully"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, {
            "service": "upload",
            "operation": "upload_file",
            "user_id": current_user.get('uid'),
            "filename": file.filename if file else None
        })
        logger.error(f"Unexpected error during upload: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during file upload"
        )

@router.get("/limits")
async def get_upload_limits(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get upload limits for current user based on their tier
    
    Args:
        current_user: Authenticated user from middleware
        
    Returns:
        Upload limits including max duration, max file size, allowed formats
    """
    try:
        user_id = current_user.get('uid')
        email = current_user.get('email', 'unknown@example.com')
        
        # Get user profile
        user_profile = await user_service.get_or_create_user(user_id, email)
        max_duration = user_profile.get('maxDuration', 1800)
        tier = user_profile.get('tier', 'free')
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "limits": {
                    "maxDuration": max_duration,
                    "maxDurationMinutes": max_duration / 60,
                    "minFileSize": storage_service.MIN_FILE_SIZE,
                    "maxFileSize": storage_service.MAX_FILE_SIZE,
                    "minFileSizeMB": storage_service.MIN_FILE_SIZE / (1024 * 1024),
                    "maxFileSizeMB": storage_service.MAX_FILE_SIZE / (1024 * 1024),
                    "allowedFormats": list(storage_service.ALLOWED_EXTENSIONS),
                    "tier": tier
                }
            }
        )
        
    except Exception as e:
        log_error(e, {
            "service": "upload",
            "operation": "get_upload_limits",
            "user_id": current_user.get('uid')
        })
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve upload limits"
        )

@router.get("/health")
async def upload_health():
    """Health check for upload service"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "File Upload",
            "maxFileSize": f"{storage_service.MAX_FILE_SIZE / (1024*1024):.0f}MB",
            "allowedFormats": list(storage_service.ALLOWED_EXTENSIONS)
        }
    )
