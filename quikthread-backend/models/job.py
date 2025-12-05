from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

class ProcessRequest(BaseModel):
    """Request model for processing audio/video"""
    type: Literal["upload", "url"] = Field(..., description="Type of input: 'upload' for Firebase Storage URL or 'url' for direct URL")
    fileUrl: Optional[str] = Field(None, description="Firebase Storage URL for uploaded files")
    contentUrl: Optional[str] = Field(None, description="Direct URL to audio/video content")
    aiInstructions: Optional[str] = Field(None, description="Custom AI instructions for post generation")
    
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
    posts: Optional[Dict[str, List[str]]] = Field(None, description="Generated posts by format (one_liner, hot_take, etc.)")
    threads: Optional[List[dict]] = Field(None, description="Legacy field - use 'posts' instead")
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
                "posts": {
                    "one_liner": ["Post 1", "Post 2", "Post 3"],
                    "hot_take": ["Take 1", "Take 2", "Take 3", "Take 4"]
                },
                "threads": None,
                "error": None,
                "createdAt": "2024-01-01T12:00:00Z",
                "completedAt": "2024-01-01T12:02:30Z"
            }
        }
