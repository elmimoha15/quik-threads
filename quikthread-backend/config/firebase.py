import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from config.settings import settings
from datetime import datetime
from typing import Optional, Dict, Any
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    if not firebase_admin._apps:
        try:
            # Check if service account key file exists
            if os.path.exists(settings.firebase_credentials_path):
                cred = credentials.Certificate(settings.firebase_credentials_path)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'quik-threads-5f5e9.firebasestorage.app'  # Updated bucket domain
                })
                print("Firebase Admin SDK initialized successfully")
            else:
                # Fallback to default credentials for local development
                firebase_admin.initialize_app()
                print("Firebase Admin SDK initialized with default credentials")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

# Initialize Firebase on module import
initialize_firebase()

# Get Firestore client
db = firestore.client()

# Get Storage bucket
bucket = storage.bucket()

async def verify_token(token: str) -> Optional[str]:
    """
    Verify Firebase ID token and return user_id
    
    Args:
        token: Firebase ID token
        
    Returns:
        user_id if token is valid, None otherwise
    """
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token['uid']
        return user_id
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch user profile from Firestore
    
    Args:
        user_id: Firebase user ID
        
    Returns:
        User profile dict or None if not found
    """
    try:
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            return user_doc.to_dict()
        else:
            return None
    except Exception as e:
        print(f"Error fetching user profile: {e}")
        return None

async def create_user_profile(user_id: str, email: str) -> Dict[str, Any]:
    """
    Create a new user profile in Firestore
    
    Args:
        user_id: Firebase user ID
        email: User email address
        
    Returns:
        Created user profile dict
    """
    try:
        user_profile = {
            'userId': user_id,
            'email': email,
            'tier': 'free',
            'creditsUsed': 0,
            'maxCredits': 2,
            'maxDuration': 1800,  # 30 minutes in seconds
            'features': {
                'analytics': False,
                'postToX': False
            },
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        # Save to Firestore
        user_ref = db.collection('users').document(user_id)
        user_ref.set(user_profile)
        
        print(f"Created user profile for {email}")
        return user_profile
        
    except Exception as e:
        print(f"Error creating user profile: {e}")
        raise

async def get_or_create_user_profile(user_id: str, email: str) -> Dict[str, Any]:
    """
    Get existing user profile or create new one
    
    Args:
        user_id: Firebase user ID
        email: User email address
        
    Returns:
        User profile dict
    """
    # Try to get existing profile
    profile = await get_user_profile(user_id)
    
    if profile is None:
        # Create new profile if doesn't exist
        profile = await create_user_profile(user_id, email)
    
    return profile
