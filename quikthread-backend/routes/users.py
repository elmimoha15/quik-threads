from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from models.user import UserProfile, QuotaInfo
from services.user_service import UserService
from middleware.auth import get_current_user
from firebase_admin import auth as firebase_auth
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/users", tags=["users"])

# Initialize user service
user_service = UserService()

@router.post("/init")
async def initialize_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Initialize user profile (create if doesn't exist)
    
    This endpoint should be called when a user first signs up or logs in.
    It creates a user profile in Firestore with free tier defaults if one doesn't exist.
    
    Args:
        current_user: Authenticated user from Firebase token
        
    Returns:
        User profile data
    """
    try:
        user_id = current_user.get('uid')
        email = current_user.get('email')
        
        if not email:
            # Try to get email from Firebase Auth
            try:
                firebase_user = firebase_auth.get_user(user_id)
                email = firebase_user.email
            except Exception as e:
                logger.error(f"Error getting user email: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail="User email not found"
                )
        
        # Get or create user profile
        user_profile = await user_service.get_or_create_user(user_id, email)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "user": user_profile,
                "message": "User profile initialized successfully"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize user profile"
        )

@router.get("/profile")
async def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user's profile
    
    Args:
        current_user: Authenticated user from Firebase token
        
    Returns:
        User profile data
    """
    try:
        user_id = current_user.get('uid')
        email = current_user.get('email')
        
        if not email:
            # Try to get email from Firebase Auth
            try:
                firebase_user = firebase_auth.get_user(user_id)
                email = firebase_user.email
            except Exception as e:
                logger.error(f"Error getting user email: {str(e)}")
                email = "unknown@example.com"
        
        # Get or create user profile
        user_profile = await user_service.get_or_create_user(user_id, email)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "user": user_profile,
                "message": "User profile retrieved successfully"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve user profile"
        )

@router.get("/quota", response_model=QuotaInfo)
async def get_user_quota(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user's quota information
    
    Returns credits used, remaining, and reset date.
    
    Args:
        current_user: Authenticated user from Firebase token
        
    Returns:
        QuotaInfo with current usage stats
    """
    try:
        user_id = current_user.get('uid')
        
        # Get quota information
        quota_info = await user_service.get_quota_info(user_id)
        
        return quota_info
        
    except Exception as e:
        logger.error(f"Error getting quota info: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve quota information"
        )
