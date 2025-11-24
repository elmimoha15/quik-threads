from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Firebase Configuration
    firebase_credentials_path: str = "./serviceAccountKey.json"
    
    # API Keys
    deepgram_api_key: str
    gemini_api_key: str
    
    # Twitter/X API Credentials
    twitter_api_key: Optional[str] = None
    twitter_api_secret: Optional[str] = None
    twitter_access_token: Optional[str] = None
    twitter_access_secret: Optional[str] = None
    
    # Polar.sh Webhook Secret
    polar_webhook_secret: Optional[str] = None
    
    # Environment
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
