from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class ProcessRequest(BaseModel):
    """Request model for processing audio/video"""
    type: Literal["upload", "url"] = Field(..., description="Type of input: 'upload' for Firebase Storage URL or 'url' for direct URL")
    fileUrl: Optional[str] = Field(None, description="Firebase Storage URL for uploaded files")
    contentUrl: Optional[str] = Field(None, description="Direct URL to audio/video content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "upload",
                "fileUrl": "https://firebasestorage.googleapis.com/v0/b/project/o/audio.mp3"
            }
        }

class JobStatus(BaseModel):
    """Job status model"""
    jobId: str = Field(..., description="Unique job identifier")
    status: Literal["processing", "transcribing", "generating", "completed", "failed"] = Field(..., description="Current job status")
    progress: int = Field(0, ge=0, le=100, description="Progress percentage (0-100)")
    type: str = Field(..., description="Type of job: 'upload' or 'url'")
    duration: Optional[float] = Field(None, description="Audio/video duration in seconds")
    threads: Optional[List[dict]] = Field(None, description="Generated thread options")
    error: Optional[str] = Field(None, description="Error message if job failed")
    createdAt: datetime = Field(..., description="Job creation timestamp")
    completedAt: Optional[datetime] = Field(None, description="Job completion timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "job_abc123",
                "status": "completed",
                "progress": 100,
                "type": "upload",
                "duration": 120.5,
                "threads": [],
                "error": None,
                "createdAt": "2024-01-01T12:00:00Z",
                "completedAt": "2024-01-01T12:02:30Z"
            }
        }
