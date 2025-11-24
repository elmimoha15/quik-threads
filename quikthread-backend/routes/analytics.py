from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from services.analytics_service import AnalyticsService
from middleware.check_feature import check_feature_access
from models.analytics import AnalyticsData
import logging

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Initialize analytics service
analytics_service = AnalyticsService()

@router.get("", response_model=AnalyticsData)
async def get_analytics(user_id: str = Depends(check_feature_access('analytics'))):
    """
    Get analytics dashboard data
    
    This endpoint is only available for Business tier users.
    It returns aggregated metrics for all of the user's posted threads.
    
    Metrics include:
    - Total impressions, reach, likes, engagements
    - Week-over-week growth
    - Posts this week
    - Daily engagement trend (last 7 days)
    - Top 5 posts by engagement
    
    Results are cached for 1 hour to reduce API calls.
    
    Args:
        user_id: User ID from feature access check (includes auth + feature validation)
        
    Returns:
        AnalyticsData with performance metrics
    """
    try:
        # Check if Twitter API is configured
        if not analytics_service.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Analytics service is not configured. Please contact support."
            )
        
        # Check cache first
        cached_data = await analytics_service.get_cached_analytics(user_id)
        
        if cached_data:
            logger.info(f"Returning cached analytics for user {user_id}")
            return JSONResponse(
                status_code=200,
                content={
                    **cached_data,
                    "cached": True
                }
            )
        
        # Cache miss or expired, fetch fresh analytics
        logger.info(f"Fetching fresh analytics for user {user_id}")
        analytics_data = await analytics_service.get_user_analytics(user_id)
        
        # Cache the results
        await analytics_service.cache_analytics(user_id, analytics_data)
        
        return JSONResponse(
            status_code=200,
            content={
                **analytics_data,
                "cached": False
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve analytics data"
        )

@router.delete("/cache")
async def clear_analytics_cache(user_id: str = Depends(check_feature_access('analytics'))):
    """
    Clear analytics cache for current user
    
    Forces fresh analytics calculation on next request.
    
    Args:
        user_id: User ID from feature access check
        
    Returns:
        Success message
    """
    try:
        from config.firebase import db
        
        db.collection('analytics-cache').document(user_id).delete()
        logger.info(f"Cleared analytics cache for user {user_id}")
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Analytics cache cleared"
            }
        )
        
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to clear analytics cache"
        )

@router.get("/health")
async def analytics_health():
    """
    Health check for analytics service
    
    Returns:
        Service status and configuration
    """
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "service": "Analytics Dashboard",
            "configured": analytics_service.is_configured()
        }
    )
