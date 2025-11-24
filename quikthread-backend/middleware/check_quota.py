from fastapi import HTTPException, status, Depends
from middleware.auth import get_current_user
from services.user_service import UserService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Initialize user service
user_service = UserService()

async def check_user_quota(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    """
    Check if user has available quota before processing
    
    This middleware function:
    1. Gets the current authenticated user
    2. Checks their quota availability
    3. Raises 429 error if quota exceeded
    4. Returns user_id if quota is available
    
    Args:
        current_user: Authenticated user from get_current_user dependency
        
    Returns:
        User ID if quota is available
        
    Raises:
        HTTPException: 429 if quota exceeded with upgrade message
    """
    try:
        user_id = current_user.get('uid')
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User ID not found in authentication token"
            )
        
        # Check if user has available quota
        has_quota = await user_service.check_quota(user_id)
        
        if not has_quota:
            # Get quota info for detailed message
            quota_info = await user_service.get_quota_info(user_id)
            
            logger.warning(f"Quota exceeded for user {user_id}: {quota_info.creditsUsed}/{quota_info.maxCredits}")
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "message": "Monthly quota exceeded. Please upgrade your plan to continue using QuikThread.",
                    "creditsUsed": quota_info.creditsUsed,
                    "maxCredits": quota_info.maxCredits,
                    "tier": quota_info.tier,
                    "resetDate": quota_info.resetDate.isoformat(),
                    "upgradeUrl": "https://quikthread.com/pricing"
                }
            )
        
        logger.info(f"Quota check passed for user {user_id}")
        return user_id
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error checking quota: {str(e)}")
        # Allow on error to not block users
        return current_user.get('uid')
