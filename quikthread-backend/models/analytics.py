from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EngagementPoint(BaseModel):
    """Daily engagement data point"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    engagements: int = Field(0, ge=0, description="Total engagements for the day")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "engagements": 250
            }
        }

class TopPost(BaseModel):
    """Top performing post"""
    title: str = Field(..., description="First tweet text (truncated)")
    engagement: int = Field(0, ge=0, description="Total engagement count")
    threadUrl: str = Field(..., description="URL to the thread on X")
    postedAt: datetime = Field(..., description="When the thread was posted")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Just launched our new AI-powered...",
                "engagement": 1250,
                "threadUrl": "https://twitter.com/user/status/123",
                "postedAt": "2024-01-15T10:30:00Z"
            }
        }

class AnalyticsData(BaseModel):
    """Analytics dashboard data"""
    totalImpressions: int = Field(0, ge=0, description="Total impressions across all posts")
    totalReach: int = Field(0, ge=0, description="Estimated unique views")
    totalLikes: int = Field(0, ge=0, description="Total likes across all posts")
    totalEngagements: int = Field(0, ge=0, description="Total engagements (likes + retweets + replies)")
    weekOverWeekGrowth: float = Field(0.0, description="Percentage change from last week")
    postsThisWeek: int = Field(0, ge=0, description="Number of posts this week")
    engagementTrend: List[EngagementPoint] = Field(default_factory=list, description="Daily engagement for last 7 days")
    topPosts: List[TopPost] = Field(default_factory=list, description="Top 5 posts by engagement")
    lastUpdated: datetime = Field(default_factory=datetime.utcnow, description="When analytics were last calculated")
    
    class Config:
        json_schema_extra = {
            "example": {
                "totalImpressions": 50000,
                "totalReach": 35000,
                "totalLikes": 2500,
                "totalEngagements": 3200,
                "weekOverWeekGrowth": 15.5,
                "postsThisWeek": 5,
                "engagementTrend": [
                    {"date": "2024-01-15", "engagements": 450},
                    {"date": "2024-01-16", "engagements": 520}
                ],
                "topPosts": [],
                "lastUpdated": "2024-01-16T12:00:00Z"
            }
        }
