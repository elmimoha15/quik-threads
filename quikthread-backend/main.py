from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn
from config.settings import settings
from middleware.auth import get_current_user
from routes.transcription import router as transcription_router
from routes.threads import router as threads_router
from routes.process import router as process_router
from routes.users import router as users_router
from routes.webhooks import router as webhooks_router
from routes.twitter import router as twitter_router
from routes.analytics import router as analytics_router
from routes.upload import router as upload_router
from routes.polar import router as polar_router
from typing import Dict, Any

# Create FastAPI app
app = FastAPI(
    title="QuikThread API",
    description="Python FastAPI backend for QuikThread - Audio/Video to X Thread Generator",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "QuikThread API is running",
        "version": "1.0.0",
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "QuikThread Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    }

@app.post("/")
async def root_post_handler():
    """
    Handle POST requests to root - likely misconfigured webhooks
    Polar webhooks should go to /api/webhooks/polar
    """
    return {
        "error": "Webhook endpoint not configured correctly",
        "message": "If this is a Polar webhook, please update your webhook URL to: {your_domain}/api/webhooks/polar",
        "correct_endpoint": "/api/webhooks/polar"
    }

@app.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "service": "QuikThread API",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment
    }

@app.get("/api/users/me")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "success": True,
        "user": current_user,
        "message": "User profile retrieved successfully"
    }

# Include routers
app.include_router(transcription_router)
app.include_router(threads_router)
app.include_router(process_router)
app.include_router(users_router)
app.include_router(webhooks_router)
app.include_router(twitter_router)
app.include_router(analytics_router)
app.include_router(upload_router)
app.include_router(polar_router, prefix="/api/polar", tags=["polar"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.environment == "development" else False
    )
