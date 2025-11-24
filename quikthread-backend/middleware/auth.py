from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.firebase import verify_token, get_or_create_user_profile
from firebase_admin import auth as firebase_auth
from typing import Optional, Dict, Any

# Security scheme for Bearer token
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Extract and verify Firebase ID token from Authorization header
    
    Args:
        credentials: HTTP Authorization credentials
        
    Returns:
        User profile dict
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    try:
        # Extract token from credentials
        token = credentials.credentials
        
        # Verify token and get user_id
        user_id = await verify_token(token)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user info from Firebase Auth to get email
        try:
            firebase_user = firebase_auth.get_user(user_id)
            email = firebase_user.email
        except Exception as e:
            print(f"Error getting Firebase user: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to fetch user information",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get or create user profile in Firestore
        user_profile = await get_or_create_user_profile(user_id, email)
        
        return user_profile
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Optional authentication - returns user if token provided and valid, None otherwise
    
    Args:
        credentials: Optional HTTP Authorization credentials
        
    Returns:
        User profile dict or None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
