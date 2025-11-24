import os
import tempfile
import uuid
from datetime import timedelta
from typing import Dict, Any, Optional, BinaryIO
from fastapi import UploadFile
from firebase_admin import storage
import ffmpeg
import logging
from utils.logger import log_error, log_event

logger = logging.getLogger(__name__)

class StorageService:
    """Service for handling file uploads to Firebase Storage"""
    
    # Allowed audio/video file types
    ALLOWED_EXTENSIONS = {'.mp3', '.mp4', '.m4a', '.wav', '.webm', '.mpeg', '.mpga', '.avi', '.mov'}
    ALLOWED_MIME_TYPES = {
        'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 
        'audio/webm', 'video/mp4', 'video/webm', 'video/mpeg', 'video/x-msvideo',
        'video/quicktime', 'application/octet-stream'
    }
    
    # File size limits
    MIN_FILE_SIZE = 1 * 1024 * 1024  # 1 MB
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
    
    def __init__(self):
        """Initialize Firebase Storage bucket"""
        self.bucket = storage.bucket()
    
    def validate_file_type(self, filename: str, content_type: str) -> bool:
        """
        Validate file type by extension and MIME type
        
        Args:
            filename: Original filename
            content_type: MIME type from upload
            
        Returns:
            True if valid, False otherwise
        """
        # Check file extension
        _, ext = os.path.splitext(filename.lower())
        if ext not in self.ALLOWED_EXTENSIONS:
            return False
        
        # Check MIME type
        if content_type not in self.ALLOWED_MIME_TYPES:
            return False
        
        return True
    
    def validate_file_size(self, file_size: int) -> Dict[str, Any]:
        """
        Validate file size
        
        Args:
            file_size: Size in bytes
            
        Returns:
            Dict with valid status and optional error message
        """
        if file_size < self.MIN_FILE_SIZE:
            return {
                "valid": False,
                "error": f"File too small. Minimum size is {self.MIN_FILE_SIZE / (1024*1024):.0f}MB"
            }
        
        if file_size > self.MAX_FILE_SIZE:
            return {
                "valid": False,
                "error": f"File too large. Maximum size is {self.MAX_FILE_SIZE / (1024*1024):.0f}MB"
            }
        
        return {"valid": True}
    
    async def get_audio_duration(self, file: UploadFile) -> Optional[float]:
        """
        Extract audio/video duration using ffprobe
        
        Args:
            file: Uploaded file
            
        Returns:
            Duration in seconds, or None if extraction fails
        """
        temp_file = None
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                # Write uploaded file to temp file
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()
                temp_path = temp_file.name
            
            # Reset file pointer for later use
            await file.seek(0)
            
            # Use ffprobe to get duration
            probe = ffmpeg.probe(temp_path)
            duration = float(probe['format']['duration'])
            
            logger.info(f"Extracted duration: {duration}s from {file.filename}")
            return duration
            
        except Exception as e:
            log_error(e, {
                "service": "storage",
                "operation": "get_audio_duration",
                "filename": file.filename
            })
            logger.error(f"Failed to extract duration: {str(e)}")
            return None
            
        finally:
            # Clean up temp file
            if temp_file and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file: {str(e)}")
    
    async def upload_file(self, user_id: str, file: UploadFile, filename: str) -> Dict[str, Any]:
        """
        Upload file to Firebase Storage
        
        Args:
            user_id: User ID for organizing uploads
            file: File to upload
            filename: Original filename
            
        Returns:
            Dict with fileUrl, fileName, size, and success status
        """
        try:
            # Generate unique filename with timestamp
            timestamp = uuid.uuid4().hex[:8]
            _, ext = os.path.splitext(filename)
            unique_filename = f"{timestamp}_{filename}"
            
            # Create storage path
            storage_path = f"users/{user_id}/uploads/{unique_filename}"
            
            # Get file content
            content = await file.read()
            file_size = len(content)
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(storage_path)
            blob.upload_from_string(
                content,
                content_type=file.content_type
            )
            
            # Generate signed URL (valid for 2 hours)
            signed_url = blob.generate_signed_url(
                expiration=timedelta(hours=2),
                method='GET'
            )
            
            logger.info(f"Uploaded file: {storage_path} ({file_size} bytes)")
            
            # Log upload event
            log_event("file_uploaded", {
                "user_id": user_id,
                "filename": unique_filename,
                "size": file_size,
                "storage_path": storage_path
            })
            
            return {
                "success": True,
                "fileUrl": signed_url,
                "fileName": unique_filename,
                "size": file_size,
                "storagePath": storage_path
            }
            
        except Exception as e:
            log_error(e, {
                "service": "storage",
                "operation": "upload_file",
                "user_id": user_id,
                "filename": filename
            })
            logger.error(f"Failed to upload file: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_file(self, storage_path: str) -> bool:
        """
        Delete file from Firebase Storage
        
        Args:
            storage_path: Path to file in storage
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            blob = self.bucket.blob(storage_path)
            blob.delete()
            logger.info(f"Deleted file: {storage_path}")
            return True
            
        except Exception as e:
            log_error(e, {
                "service": "storage",
                "operation": "delete_file",
                "storage_path": storage_path
            })
            logger.error(f"Failed to delete file: {str(e)}")
            return False
