from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from services.twitter_service import TwitterService
from services.job_service import JobService
from middleware.check_feature import check_feature_access
from config.firebase import db
from typing import Dict, Any
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/twitter", tags=["twitter"])

# Initialize services
twitter_service = TwitterService()
job_service = JobService()

class PostThreadRequest(BaseModel):
    """Request model for posting a thread to X"""
    jobId: str
    threadIndex: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "jobId": "job_abc123",
                "threadIndex": 0
            }
        }

@router.post("/post")
async def post_thread_to_twitter(
    request: PostThreadRequest,
    user_id: str = Depends(check_feature_access('postToX'))
):
    """
    Post a generated thread to X (Twitter)
    
    This endpoint is only available for Pro and Business tier users.
    It posts the selected thread from a completed job to X as a threaded conversation.
    
    Args:
        request: PostThreadRequest with jobId and threadIndex
        user_id: User ID from feature access check (includes auth + feature validation)
        
    Returns:
        Success response with thread URL and tweet IDs
    """
    try:
        # Check if Twitter API is configured
        if not twitter_service.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Twitter API is not configured. Please contact support."
            )
        
        # Get job from Firestore
        job_data = await job_service.get_job(request.jobId)
        
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
        
        # Verify job is completed
        if job_data.get('status') != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"Job is not completed. Current status: {job_data.get('status')}"
            )
        
        # Get threads from job
        threads = job_data.get('threads', [])
        
        if not threads:
            raise HTTPException(
                status_code=400,
                detail="No threads found in job"
            )
        
        # Validate thread index
        if request.threadIndex < 0 or request.threadIndex >= len(threads):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid thread index. Must be between 0 and {len(threads)-1}"
            )
        
        # Get selected thread
        selected_thread = threads[request.threadIndex]
        tweets = selected_thread.get('tweets', [])
        
        if not tweets:
            raise HTTPException(
                status_code=400,
                detail="Selected thread has no tweets"
            )
        
        logger.info(f"Posting thread for user {user_id}, job {request.jobId}, thread {request.threadIndex}")
        
        # Post thread to Twitter
        result = twitter_service.post_thread(tweets)
        
        if not result.get('success'):
            logger.error(f"Failed to post thread: {result.get('error')}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to post thread: {result.get('error')}"
            )
        
        # Save post record to Firestore
        post_id = f"post_{uuid.uuid4().hex[:12]}"
        post_data = {
            'postId': post_id,
            'userId': user_id,
            'jobId': request.jobId,
            'threadIndex': request.threadIndex,
            'tweetIds': result.get('tweet_ids', []),
            'threadUrl': result.get('thread_url'),
            'tweetCount': result.get('tweet_count', len(tweets)),
            'postedAt': datetime.utcnow(),
            'status': 'posted'
        }
        
        db.collection('posts').document(post_id).set(post_data)
        logger.info(f"Saved post record: {post_id}")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "postId": post_id,
                "threadUrl": result.get('thread_url'),
                "tweetIds": result.get('tweet_ids', []),
                "tweetCount": result.get('tweet_count', 0),
                "message": "Thread posted successfully to X"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error posting thread: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while posting thread"
        )

@router.get("/posts")
async def get_user_posts(user_id: str = Depends(check_feature_access('postToX'))):
    """
    Get all posts for current user
    
    Args:
        user_id: User ID from feature access check
        
    Returns:
        List of user's posted threads
    """
    try:
        # Query posts for user
        posts_query = (
            db.collection('posts')
            .where('userId', '==', user_id)
            .order_by('postedAt', direction='DESCENDING')
            .limit(50)
        )
        
        posts = []
        for doc in posts_query.stream():
            post_data = doc.to_dict()
            posts.append(post_data)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "posts": posts,
                "count": len(posts)
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting user posts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve posts"
        )

@router.get("/health")
async def twitter_health():
    """
    Health check for Twitter service
    
    Returns:
        Service status and configuration
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "Twitter/X Integration",
            "configured": twitter_service.is_configured()
        }
    )
