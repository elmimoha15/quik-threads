from pydantic import BaseModel, Field, EmailStr
from typing import Dict, Optional
from datetime import datetime

class UserFeatures(BaseModel):
    """User tier features"""
    postToX: bool = Field(False, description="Can post directly to X/Twitter")
    analytics: bool = Field(False, description="Access to analytics dashboard")

class UserProfile(BaseModel):
    """User profile model"""
    userId: str = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User email address")
    tier: str = Field("free", description="User tier: free, pro, or business")
    creditsUsed: int = Field(0, ge=0, description="Credits used this billing period")
    maxCredits: int = Field(2, gt=0, description="Maximum credits per billing period")
    maxDuration: int = Field(1800, gt=0, description="Maximum audio duration in seconds (30 min = 1800s)")
    features: UserFeatures = Field(default_factory=UserFeatures, description="Tier-specific features")
    resetDate: datetime = Field(..., description="Date when credits reset (first day of next month)")
    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Account creation timestamp")
    updatedAt: Optional[datetime] = Field(None, description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "user123",
                "email": "user@example.com",
                "tier": "free",
                "creditsUsed": 1,
                "maxCredits": 2,
                "maxDuration": 1800,
                "features": {
                    "postToX": False,
                    "analytics": False
                },
                "resetDate": "2024-02-01T00:00:00Z",
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-20T14:45:00Z"
            }
        }

class QuotaInfo(BaseModel):
    """User quota information"""
    creditsUsed: int = Field(..., ge=0, description="Credits used this billing period")
    maxCredits: int = Field(..., gt=0, description="Maximum credits per billing period")
    remaining: int = Field(..., ge=0, description="Credits remaining")
    tier: str = Field(..., description="Current user tier")
    resetDate: datetime = Field(..., description="Date when credits reset")
    
    class Config:
        json_schema_extra = {
            "example": {
                "creditsUsed": 1,
                "maxCredits": 2,
                "remaining": 1,
                "tier": "free",
                "resetDate": "2024-02-01T00:00:00Z"
            }
        }
