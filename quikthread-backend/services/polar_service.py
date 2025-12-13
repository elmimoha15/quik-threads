import hmac
import hashlib
import base64
import json
from typing import Dict, Any, Optional
from datetime import datetime
from config.firebase import db
from services.user_service import UserService
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class PolarService:
    """Service for handling Polar.sh webhook events"""
    
    def __init__(self):
        self.user_service = UserService()
        self.users_collection = db.collection('users')
        self.webhook_secret = settings.polar_webhook_secret
    
    def verify_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify webhook signature using HMAC-SHA256
        
        Polar.sh follows the Standard Webhooks specification.
        Signature header format: "v1,signature1 v1,signature2"
        
        Args:
            payload: Raw request body as bytes
            signature: Signature from webhook headers
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            if not self.webhook_secret:
                logger.error("Polar webhook secret not configured")
                return False
            
            # Standard Webhooks format: "v1,base64sig v1,base64sig"
            # We need to check if any signature matches
            signatures = signature.split(' ')
            
            for sig_part in signatures:
                if ',' in sig_part:
                    version, sig_value = sig_part.split(',', 1)
                    if version == 'v1':
                        # The secret is already base64 encoded in the dashboard
                        # We need to decode it first
                        secret_bytes = base64.b64decode(self.webhook_secret.replace('polar_whs_', ''))
                        
                        # Generate HMAC-SHA256 signature
                        expected_signature = hmac.new(
                            secret_bytes,
                            payload,
                            hashlib.sha256
                        ).digest()
                        
                        # Base64 encode the signature
                        expected_signature_b64 = base64.b64encode(expected_signature).decode()
                        
                        # Compare signatures (constant-time comparison)
                        if hmac.compare_digest(sig_value, expected_signature_b64):
                            return True
            
            logger.error("No matching signature found")
            return False
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False
    
    async def handle_checkout_success(self, event_data: Dict[str, Any]) -> None:
        """
        Handle successful checkout event - upgrade user tier
        
        Args:
            event_data: Webhook event data containing customer and product info
        """
        try:
            # Extract customer email and product ID
            customer_email = event_data.get('data', {}).get('customer_email')
            product_id = event_data.get('data', {}).get('product_id')
            
            if not customer_email:
                logger.error("No customer email in checkout success event")
                return
            
            # Find user by email
            users_query = self.users_collection.where('email', '==', customer_email).limit(1)
            users = list(users_query.stream())
            
            if not users:
                logger.warning(f"User not found for email: {customer_email}")
                return
            
            user_id = users[0].id
            
            # Determine tier and limits based on product ID
            if product_id == 'prod_pro':
                tier = 'pro'
                max_credits = 30
                max_duration = 3600  # 60 minutes
                features = {
                    'postToX': True,
                    'analytics': False
                }
                logger.info(f"Upgrading user {user_id} to Pro tier")
                
            elif product_id == 'prod_business':
                tier = 'business'
                max_credits = 100
                max_duration = 3600  # 60 minutes
                features = {
                    'postToX': True,
                    'analytics': True
                }
                logger.info(f"Upgrading user {user_id} to Business tier")
                
            else:
                logger.warning(f"Unknown product ID: {product_id}")
                return
            
            # Update user tier
            await self.user_service.update_user_tier(
                user_id=user_id,
                tier=tier,
                max_credits=max_credits,
                max_duration=max_duration,
                features=features
            )
            
            logger.info(f"Successfully upgraded user {user_id} ({customer_email}) to {tier} tier")
            
        except Exception as e:
            logger.error(f"Error handling checkout success: {str(e)}")
            raise
    
    async def handle_subscription_cancelled(self, event_data: Dict[str, Any]) -> None:
        """
        Handle subscription cancellation - downgrade user to free tier
        
        Args:
            event_data: Webhook event data containing customer info
        """
        try:
            # Extract customer email or ID
            customer_email = event_data.get('data', {}).get('customer_email')
            customer_id = event_data.get('data', {}).get('customer_id')
            
            # Try to find user by email first, then by customer ID
            user_id = None
            
            if customer_email:
                users_query = self.users_collection.where('email', '==', customer_email).limit(1)
                users = list(users_query.stream())
                if users:
                    user_id = users[0].id
            
            if not user_id and customer_id:
                # Try finding by customer ID stored in user profile
                users_query = self.users_collection.where('customerId', '==', customer_id).limit(1)
                users = list(users_query.stream())
                if users:
                    user_id = users[0].id
            
            if not user_id:
                logger.warning(f"User not found for subscription cancellation: {customer_email or customer_id}")
                return
            
            # Downgrade to free tier
            tier = 'free'
            max_credits = 2
            max_duration = 1800  # 30 minutes
            features = {
                'postToX': False,
                'analytics': False
            }
            
            await self.user_service.update_user_tier(
                user_id=user_id,
                tier=tier,
                max_credits=max_credits,
                max_duration=max_duration,
                features=features
            )
            
            logger.info(f"Successfully downgraded user {user_id} to free tier")
            
        except Exception as e:
            logger.error(f"Error handling subscription cancellation: {str(e)}")
            raise
    
    async def log_webhook_event(self, event_type: str, event_data: Dict[str, Any], 
                                 status: str, error: Optional[str] = None) -> None:
        """
        Log webhook event to Firestore for monitoring
        
        Args:
            event_type: Type of webhook event
            event_data: Event payload data
            status: Processing status (success/failed)
            error: Error message if failed
        """
        try:
            log_data = {
                'eventType': event_type,
                'eventData': event_data,
                'status': status,
                'error': error,
                'timestamp': datetime.utcnow(),
                'processedAt': datetime.utcnow()
            }
            
            db.collection('webhook-logs').add(log_data)
            logger.info(f"Logged webhook event: {event_type} - {status}")
            
        except Exception as e:
            logger.error(f"Error logging webhook event: {str(e)}")
            # Don't raise - logging failure shouldn't fail the webhook
