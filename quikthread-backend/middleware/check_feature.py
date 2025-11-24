from fastapi import HTTPException, status, Depends
from middleware.auth import get_current_user
from services.user_service import UserService
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Initialize user service
user_service = UserService()

def check_feature_access(feature_name: str):
    """
    Factory function to create feature access checker middleware
    
    Args:
        feature_name: Name of the feature to check (e.g., 'postToX', 'analytics')
        
    Returns:
        Dependency function that checks feature access
    """
    async def _check_feature(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
        """
        Check if user has access to a specific feature
        
        This middleware function:
        1. Gets the current authenticated user
        2. Retrieves their user profile from Firestore
        3. Checks if the feature is enabled for their tier
        4. Raises 403 error if feature not available
        5. Returns user_id if feature is available
        
        Args:
            current_user: Authenticated user from get_current_user dependency
            
        Returns:
            User ID if feature is available
            
        Raises:
            HTTPException: 403 if feature not available with upgrade message
        """
        try:
            user_id = current_user.get('uid')
            email = current_user.get('email')
            
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User ID not found in authentication token"
                )
            
            # Get user profile
            user_profile = await user_service.get_or_create_user(user_id, email or "unknown@example.com")
            
            # Check if feature is enabled
            features = user_profile.get('features', {})
            feature_enabled = features.get(feature_name, False)
            
            if not feature_enabled:
                tier = user_profile.get('tier', 'free')
                
                # Create helpful upgrade message based on feature
                feature_messages = {
                    'postToX': 'Direct posting to X (Twitter) is only available for Pro and Business tier users.',
                    'analytics': 'Analytics dashboard is only available for Business tier users.'
                }
                
                feature_message = feature_messages.get(
                    feature_name, 
                    f'The {feature_name} feature is not available on your current plan.'
                )
                
                logger.warning(f"Feature access denied for user {user_id}: {feature_name} (tier: {tier})")
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "message": f"{feature_message} Please upgrade your plan to access this feature.",
                        "feature": feature_name,
                        "currentTier": tier,
                        "requiredTier": "pro" if feature_name == "postToX" else "business",
                        "upgradeUrl": "https://quikthread.com/pricing"
                    }
                )
            
            logger.info(f"Feature access granted for user {user_id}: {feature_name}")
            return user_id
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            logger.error(f"Error checking feature access: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify feature access"
            )
    
    return _check_feature
