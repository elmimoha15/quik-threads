from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging
from config.settings import settings

router = APIRouter()
logger = logging.getLogger(__name__)

POLAR_API_BASE = 'https://sandbox-api.polar.sh/v1'

class CreateCheckoutRequest(BaseModel):
    plan_type: str  # 'pro' or 'business'
    customer_email: str
    customer_name: str | None = None
    user_id: str

class CreateCheckoutResponse(BaseModel):
    checkout_url: str

@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout(request: CreateCheckoutRequest):
    """
    Create a Polar checkout session (server-side)
    This keeps the OAT token secure on the backend
    """
    try:
        logger.info(f"Creating checkout for user {request.user_id}, plan: {request.plan_type}")
        
        # Select product ID based on plan type
        product_id = (
            settings.polar_product_id_pro 
            if request.plan_type == 'pro' 
            else settings.polar_product_id_business
        )
        
        if not product_id:
            logger.error(f"Product ID not configured for plan: {request.plan_type}")
            raise HTTPException(status_code=500, detail="Product ID not configured")
        
        if not settings.polar_access_token:
            logger.error("Polar access token not configured")
            raise HTTPException(status_code=500, detail="Polar access token not configured")
        
        # Construct success URL - redirect to onboarding Twitter step after payment
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        success_url = f"{frontend_url}/#/onboarding?step=5&checkout=success&plan={request.plan_type}"
        
        logger.info(f"Creating checkout with product_id: {product_id}")
        
        # Create checkout via Polar API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{POLAR_API_BASE}/checkouts/",
                headers={
                    "Authorization": f"Bearer {settings.polar_access_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "products": [product_id],
                    "customer_email": request.customer_email,
                    "success_url": success_url,
                    "metadata": {
                        "user_id": request.user_id,
                        "plan_type": request.plan_type,
                    }
                },
                timeout=30.0
            )
            
            logger.info(f"Polar API response status: {response.status_code}")
            
            if response.status_code != 200 and response.status_code != 201:
                error_detail = response.json() if response.text else "Unknown error"
                logger.error(f"Polar API error: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Polar API error: {error_detail}"
                )
            
            checkout_data = response.json()
            checkout_url = checkout_data.get("url")
            
            if not checkout_url:
                logger.error(f"No URL in Polar response: {checkout_data}")
                raise HTTPException(status_code=500, detail="No checkout URL returned from Polar")
            
            logger.info(f"Checkout created successfully: {checkout_url}")
            return CreateCheckoutResponse(checkout_url=checkout_url)
            
    except httpx.HTTPError as e:
        logger.error(f"HTTP error creating checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating checkout: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
