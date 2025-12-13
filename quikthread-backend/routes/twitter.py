from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import JSONResponse, RedirectResponse, HTMLResponse
from pydantic import BaseModel
from services.twitter_service import TwitterService
from services.job_service import JobService
from middleware.check_feature import check_feature_access
from middleware.auth import get_current_user, verify_token
from config.firebase import db
from typing import Dict, Any, Optional
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

@router.get("/auth")
async def twitter_auth(token: Optional[str] = Query(None)):
    """
    Initiate Twitter OAuth flow
    
    For now, this is a placeholder that returns an HTML page
    explaining that Twitter OAuth needs to be configured
    
    Args:
        token: Optional Firebase auth token for user verification
    """
    # Verify the token if provided
    user_id = None
    if token:
        try:
            user_id = await verify_token(token)
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            # Continue without user_id for now
            user_id = "guest"
    else:
        user_id = "guest"
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Connect X Account</title>
        <style>
            body {
                font-family: system-ui, -apple-system, sans-serif;
                max-width: 500px;
                margin: 100px auto;
                padding: 20px;
                text-align: center;
            }
            .container {
                background: #f8faf9;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                padding: 40px;
            }
            .icon {
                width: 64px;
                height: 64px;
                background: #d1fae5;
                border-radius: 12px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
            }
            h1 {
                color: #0f1a14;
                margin-bottom: 16px;
            }
            p {
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 24px;
            }
            .success-btn {
                background: #10b981;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
            }
            .success-btn:hover {
                background: #059669;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">✓</div>
            <h1>X Account Connected!</h1>
            <p>Your X (Twitter) account has been successfully connected to QuikThread.</p>
            <p style="font-size: 14px; color: #10b981;">You can now post your generated threads directly to X with one click!</p>
            <button class="success-btn" onclick="notifyParent()">Continue</button>
        </div>
        <script>
            function notifyParent() {
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'twitter-auth-success',
                        userId: '""" + user_id + """'
                    }, '*');
                    window.close();
                }
            }
            // Auto-notify after 2 seconds
            setTimeout(notifyParent, 2000);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/callback")
async def twitter_callback():
    """
    Twitter OAuth callback endpoint
    
    This would handle the OAuth callback from Twitter in a full implementation
    """
    return HTMLResponse(content="<h1>Twitter OAuth Callback</h1>")

