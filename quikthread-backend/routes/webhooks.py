from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from services.polar_service import PolarService
from typing import Dict, Any
import logging
import json

logger = logging.getLogger(__name__)

# Create router (NO auth middleware for webhooks)
router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

# Initialize Polar service
polar_service = PolarService()

@router.post("/polar")
async def handle_polar_webhook(request: Request):
    """
    Handle Polar.sh webhook events
    
    This endpoint receives webhook events from Polar.sh for payment processing.
    NO authentication required - uses signature verification instead.
    
    Supported events:
    - checkout.created / checkout.updated: Upgrade user tier on successful payment
    - subscription.cancelled: Downgrade user to free tier
    
    Args:
        request: FastAPI request object with headers and body
        
    Returns:
        200 OK immediately to acknowledge receipt
    """
    try:
        # Get raw body for signature verification
        body = await request.body()
        
        # Extract signature from headers
        # Polar.sh uses Standard Webhooks format: webhook-signature header
        signature = request.headers.get('webhook-signature') or request.headers.get('Webhook-Signature')
        
        if not signature:
            logger.error("No webhook signature found in headers")
            return JSONResponse(
                status_code=401,
                content={"error": "Missing webhook signature"}
            )
        
        # Verify signature
        is_valid = polar_service.verify_signature(body, signature)
        
        if not is_valid:
            logger.error("Invalid webhook signature")
            await polar_service.log_webhook_event(
                event_type="unknown",
                event_data={},
                status="failed",
                error="Invalid signature"
            )
            return JSONResponse(
                status_code=401,
                content={"error": "Invalid webhook signature"}
            )
        
        # Parse event data
        try:
            event_data = json.loads(body.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse webhook payload: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid JSON payload"}
            )
        
        # Extract event type
        event_type = event_data.get('type') or event_data.get('event')
        
        if not event_type:
            logger.error("No event type found in webhook payload")
            return JSONResponse(
                status_code=400,
                content={"error": "Missing event type"}
            )
        
        logger.info(f"Received Polar webhook: {event_type}")
        
        # Handle different event types
        try:
            if event_type in ['checkout.created', 'checkout.updated', 'order.created']:
                # Check if payment was successful
                payment_status = event_data.get('data', {}).get('status')
                if payment_status == 'succeeded' or payment_status == 'completed':
                    await polar_service.handle_checkout_success(event_data)
                    await polar_service.log_webhook_event(
                        event_type=event_type,
                        event_data=event_data,
                        status="success"
                    )
                else:
                    logger.info(f"Checkout not completed yet: {payment_status}")
                    
            elif event_type in ['subscription.cancelled', 'subscription.canceled']:
                await polar_service.handle_subscription_cancelled(event_data)
                await polar_service.log_webhook_event(
                    event_type=event_type,
                    event_data=event_data,
                    status="success"
                )
                
            else:
                # Log unhandled event types for monitoring
                logger.info(f"Unhandled webhook event type: {event_type}")
                await polar_service.log_webhook_event(
                    event_type=event_type,
                    event_data=event_data,
                    status="ignored",
                    error="Unhandled event type"
                )
            
            # Return 200 immediately (don't make Polar wait)
            return JSONResponse(
                status_code=200,
                content={"received": True}
            )
            
        except Exception as e:
            logger.error(f"Error processing webhook event: {str(e)}")
            await polar_service.log_webhook_event(
                event_type=event_type,
                event_data=event_data,
                status="failed",
                error=str(e)
            )
            
            # Still return 200 to acknowledge receipt
            # We don't want Polar to retry if it's our processing error
            return JSONResponse(
                status_code=200,
                content={"received": True, "error": "Processing error"}
            )
            
    except Exception as e:
        logger.error(f"Unexpected error in webhook handler: {str(e)}")
        # Return 500 for unexpected errors so Polar can retry
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@router.get("/polar/health")
async def webhook_health():
    """Health check for webhook endpoint"""
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "Polar Webhooks",
            "configured": polar_service.webhook_secret is not None
        }
    )
