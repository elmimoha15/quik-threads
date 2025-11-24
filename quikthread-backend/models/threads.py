from pydantic import BaseModel
from typing import List, Optional

class ThreadGenerationRequest(BaseModel):
    """Request model for thread generation"""
    transcript: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "transcript": "Today I want to talk about the importance of building habits. Research shows that it takes 21 days to form a new habit, but the reality is more complex than that..."
            }
        }

class Thread(BaseModel):
    """Model for a single X thread"""
    threadNumber: int
    hook: str
    tweets: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "threadNumber": 1,
                "hook": "Question-based hook about habit formation",
                "tweets": [
                    "🧠 Think it takes 21 days to build a habit? Think again.\n\nThe real science behind habit formation will surprise you 👇",
                    "📊 Research from University College London studied 96 people forming new habits.\n\nThe average time? 66 days.\n\nBut here's the kicker...",
                    "⏰ Simple habits (drinking water) took 18 days\n🏋️ Complex habits (50 pushups) took 254 days\n\nThe complexity matters more than you think.",
                    "🔑 The secret isn't time - it's consistency.\n\nMissing one day won't break your habit, but missing two days in a row starts the decline.",
                    "💡 Start ridiculously small:\n• Want to read? Start with 1 page\n• Want to exercise? Start with 1 pushup\n• Want to meditate? Start with 1 minute",
                    "🚀 What habit are you building right now?\n\nShare below and let's support each other! 👇"
                ]
            }
        }

class ThreadGenerationResponse(BaseModel):
    """Response model for thread generation"""
    threads: List[Thread]
    success: bool
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "threads": [
                    {
                        "threadNumber": 1,
                        "hook": "Question-based hook about habit formation",
                        "tweets": [
                            "🧠 Think it takes 21 days to build a habit? Think again...",
                            "📊 Research from University College London studied 96 people...",
                            "⏰ Simple habits took 18 days, complex habits took 254 days...",
                            "🔑 The secret isn't time - it's consistency...",
                            "💡 Start ridiculously small: 1 page, 1 pushup, 1 minute...",
                            "🚀 What habit are you building right now? Share below! 👇"
                        ]
                    }
                ],
                "success": True,
                "error": None
            }
        }
