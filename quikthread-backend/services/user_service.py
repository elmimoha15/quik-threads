from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from dateutil.relativedelta import relativedelta
from config.firebase import db
from models.user import UserProfile, QuotaInfo, UserFeatures
import logging

logger = logging.getLogger(__name__)

class UserService:
    """Service for managing user profiles and quotas"""
    
    def __init__(self):
        self.users_collection = db.collection('users')
    
    def _get_next_reset_date(self) -> datetime:
        """
        Calculate the first day of next month for quota reset
        
        Returns:
            Datetime for first day of next month at 00:00:00
        """
        now = datetime.utcnow()
        # Get first day of next month
        next_month = now.replace(day=1) + relativedelta(months=1)
        return next_month.replace(hour=0, minute=0, second=0, microsecond=0)
    
    def _create_user_profile(self, user_id: str, email: str) -> Dict[str, Any]:
        """
        Create a new user profile with free tier defaults
        
        Args:
            user_id: User ID
            email: User email
            
        Returns:
            User profile data
        """
        now = datetime.utcnow()
        reset_date = self._get_next_reset_date()
        
        user_data = {
            'userId': user_id,
            'email': email,
            'tier': 'free',
            'creditsUsed': 0,
            'maxCredits': 2,
            'maxDuration': 1800,  # 30 minutes
            'features': {
                'postToX': False,
                'analytics': False
            },
            'resetDate': reset_date,
            'createdAt': now,
            'updatedAt': now
        }
        
        # Save to Firestore
        self.users_collection.document(user_id).set(user_data)
        logger.info(f"Created user profile for {user_id} ({email})")
        
        return user_data
    
    async def get_or_create_user(self, user_id: str, email: str) -> Dict[str, Any]:
        """
        Get user profile or create if doesn't exist
        
        Args:
            user_id: User ID
            email: User email
            
        Returns:
            User profile data
        """
        try:
            user_ref = self.users_collection.document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                
                # Sync backend fields if they don't exist (for users created via frontend onboarding)
                needs_update = False
                updates = {}
                
                # Check if backend-specific fields are missing
                if 'tier' not in user_data and 'plan' in user_data:
                    # Map frontend 'plan' to backend 'tier'
                    plan = user_data.get('plan', 'free')
                    updates['tier'] = plan
                    needs_update = True
                
                if 'maxCredits' not in user_data:
                    # Set maxCredits based on plan/tier
                    tier = user_data.get('tier') or user_data.get('plan', 'free')
                    credits_map = {'free': 2, 'pro': 30, 'business': 100}
                    updates['maxCredits'] = credits_map.get(tier, 2)
                    needs_update = True
                
                if 'creditsUsed' not in user_data:
                    updates['creditsUsed'] = user_data.get('generationsUsed', 0)
                    needs_update = True
                
                if 'maxDuration' not in user_data:
                    tier = user_data.get('tier') or user_data.get('plan', 'free')
                    duration_map = {'free': 1800, 'pro': 3600, 'business': 3600}
                    updates['maxDuration'] = duration_map.get(tier, 1800)
                    needs_update = True
                
                if 'features' not in user_data:
                    tier = user_data.get('tier') or user_data.get('plan', 'free')
                    features_map = {
                        'free': {'postToX': False, 'analytics': False},
                        'pro': {'postToX': True, 'analytics': False},
                        'business': {'postToX': True, 'analytics': True}
                    }
                    updates['features'] = features_map.get(tier, {'postToX': False, 'analytics': False})
                    needs_update = True
                
                if 'resetDate' not in user_data or user_data.get('resetDate') is None:
                    updates['resetDate'] = self._get_next_reset_date()
                    needs_update = True
                
                # Update if needed
                if needs_update:
                    updates['updatedAt'] = datetime.utcnow()
                    user_ref.update(updates)
                    user_data.update(updates)
                    logger.info(f"Synced backend fields for user {user_id}")
                
                logger.info(f"Retrieved user profile for {user_id}")
                return user_data
            else:
                # Create new user profile
                user_data = self._create_user_profile(user_id, email)
                return user_data
                
        except Exception as e:
            logger.error(f"Error getting/creating user: {str(e)}")
            raise
    
    async def check_quota(self, user_id: str) -> bool:
        """
        Check if user has available quota
        
        Args:
            user_id: User ID to check
            
        Returns:
            True if quota available, False if exceeded
        """
        try:
            user_ref = self.users_collection.document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                # New user, allow (will be created on first request)
                return True
            
            user_data = user_doc.to_dict()
            credits_used = user_data.get('creditsUsed', 0)
            max_credits = user_data.get('maxCredits', 2)
            reset_date = user_data.get('resetDate')
            
            # Check if reset date has passed
            if reset_date:
                # Convert Firestore timestamp to datetime if needed
                if hasattr(reset_date, 'timestamp'):
                    reset_date = datetime.fromtimestamp(reset_date.timestamp())
                
                now = datetime.utcnow()
                
                # If reset date has passed, reset credits
                if now >= reset_date:
                    new_reset_date = self._get_next_reset_date()
                    user_ref.update({
                        'creditsUsed': 0,
                        'resetDate': new_reset_date,
                        'updatedAt': now
                    })
                    logger.info(f"Reset credits for user {user_id}, next reset: {new_reset_date}")
                    return True
            
            # Check if user has credits remaining
            has_quota = credits_used < max_credits
            logger.info(f"Quota check for {user_id}: {credits_used}/{max_credits} - {'Available' if has_quota else 'Exceeded'}")
            
            return has_quota
            
        except Exception as e:
            logger.error(f"Error checking quota: {str(e)}")
            # Allow on error to not block users
            return True
    
    async def increment_credits(self, user_id: str) -> None:
        """
        Increment user's creditsUsed by 1
        
        Args:
            user_id: User ID
        """
        try:
            user_ref = self.users_collection.document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                current_credits = user_data.get('creditsUsed', 0)
                
                user_ref.update({
                    'creditsUsed': current_credits + 1,
                    'updatedAt': datetime.utcnow()
                })
                
                logger.info(f"Incremented credits for user {user_id}: {current_credits} -> {current_credits + 1}")
            else:
                logger.warning(f"User {user_id} not found when incrementing credits")
                
        except Exception as e:
            logger.error(f"Error incrementing credits: {str(e)}")
            # Don't raise - this shouldn't fail the operation
    
    async def get_quota_info(self, user_id: str) -> QuotaInfo:
        """
        Get user's quota information
        
        Args:
            user_id: User ID
            
        Returns:
            QuotaInfo with current usage stats
        """
        try:
            user_ref = self.users_collection.document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                # Return default free tier quota
                reset_date = self._get_next_reset_date()
                return QuotaInfo(
                    creditsUsed=0,
                    maxCredits=2,
                    remaining=2,
                    tier='free',
                    resetDate=reset_date
                )
            
            user_data = user_doc.to_dict()
            
            # Support both frontend (generationsUsed) and backend (creditsUsed) field names
            credits_used = user_data.get('creditsUsed', user_data.get('generationsUsed', 0))
            
            # Get tier from either 'tier' or 'plan' field
            tier = user_data.get('tier', user_data.get('plan', 'free'))
            
            # Set maxCredits based on tier if not present
            if 'maxCredits' in user_data:
                max_credits = user_data.get('maxCredits')
            else:
                credits_map = {'free': 2, 'pro': 30, 'business': 100}
                max_credits = credits_map.get(tier, 2)
            
            reset_date = user_data.get('resetDate')
            
            # Convert Firestore timestamp if needed, or use next reset date if None
            if reset_date:
                if hasattr(reset_date, 'timestamp'):
                    reset_date = datetime.fromtimestamp(reset_date.timestamp())
            else:
                # If no reset date, calculate next one
                reset_date = self._get_next_reset_date()
            
            remaining = max(0, max_credits - credits_used)
            
            return QuotaInfo(
                creditsUsed=credits_used,
                maxCredits=max_credits,
                remaining=remaining,
                tier=tier,
                resetDate=reset_date
            )
            
        except Exception as e:
            logger.error(f"Error getting quota info: {str(e)}")
            raise
    
    async def update_user_tier(self, user_id: str, tier: str, max_credits: int, 
                               max_duration: int, features: Dict[str, bool]) -> None:
        """
        Update user's tier and associated limits
        
        Args:
            user_id: User ID
            tier: New tier (free, pro, business)
            max_credits: Maximum credits per month
            max_duration: Maximum audio duration in seconds
            features: Feature flags
        """
        try:
            user_ref = self.users_collection.document(user_id)
            
            user_ref.update({
                'tier': tier,
                'maxCredits': max_credits,
                'maxDuration': max_duration,
                'features': features,
                'updatedAt': datetime.utcnow()
            })
            
            logger.info(f"Updated user {user_id} to tier {tier}")
            
        except Exception as e:
            logger.error(f"Error updating user tier: {str(e)}")
            raise
