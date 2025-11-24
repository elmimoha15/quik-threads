import google.generativeai as genai
from config.settings import settings
from typing import Dict, Any, List
import json
import re
from utils.logger import log_error, log_event

class GeminiService:
    """Service for generating X (Twitter) threads using Google Gemini AI"""
    
    def __init__(self):
        """Initialize Gemini client with API key"""
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    async def generate_threads(self, transcript: str) -> Dict[str, Any]:
        """
        Generate 5 viral X thread options from transcript using Gemini
        
        Args:
            transcript: The transcribed text to convert into threads
            
        Returns:
            Dict with threads array, success status, and optional error
        """
        try:
            # Create the prompt for viral X threads
            prompt = f"""
You are an expert social media content creator specializing in viral X (Twitter) threads. 

Convert the following transcript into 5 different viral X thread options. Each thread should:

1. Have 5-8 tweets total
2. Start with an attention-grabbing hook (question, bold claim, or compelling story)
3. Each tweet must be 270 characters or less
4. Use emojis strategically and line breaks for readability
5. End with a strong call-to-action
6. Be engaging, shareable, and provide value

Return ONLY a JSON array in this exact format:
[
  {{
    "threadNumber": 1,
    "hook": "Brief description of the hook strategy",
    "tweets": ["Tweet 1 text here", "Tweet 2 text here", "Tweet 3 text here", "Tweet 4 text here", "Tweet 5 text here"]
  }},
  {{
    "threadNumber": 2,
    "hook": "Brief description of the hook strategy", 
    "tweets": ["Tweet 1 text here", "Tweet 2 text here", "Tweet 3 text here", "Tweet 4 text here", "Tweet 5 text here"]
  }}
]

Transcript to convert:
{transcript}

Remember: Return ONLY the JSON array, no other text or markdown formatting.
"""

            # Configure generation settings
            generation_config = genai.types.GenerationConfig(
                temperature=0.8,
                max_output_tokens=2000,
            )
            
            # Generate content
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config
            )
            
            # Extract and clean the response text
            response_text = response.text.strip()
            
            # Remove any markdown formatting (```json, ```, etc.)
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*', '', response_text)
            response_text = response_text.strip()
            
            # Parse JSON response
            try:
                threads_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Response text: {response_text}")
                return {
                    "threads": [],
                    "success": False,
                    "error": f"Failed to parse JSON response: {str(e)}"
                }
            
            # Validate and process threads
            processed_threads = []
            for thread in threads_data:
                if not isinstance(thread, dict):
                    continue
                    
                # Validate required fields
                if "threadNumber" not in thread or "tweets" not in thread:
                    continue
                
                # Truncate tweets that are too long (280 char limit)
                validated_tweets = []
                for tweet in thread.get("tweets", []):
                    if len(tweet) > 280:
                        tweet = tweet[:277] + "..."
                    validated_tweets.append(tweet)
                
                processed_thread = {
                    "threadNumber": thread.get("threadNumber"),
                    "hook": thread.get("hook", ""),
                    "tweets": validated_tweets
                }
                processed_threads.append(processed_thread)
            
            # Ensure we have exactly 5 threads
            if len(processed_threads) < 5:
                return {
                    "threads": processed_threads,
                    "success": False,
                    "error": f"Generated only {len(processed_threads)} threads, expected 5"
                }
            
            return {
                "threads": processed_threads[:5],  # Take first 5 threads
                "success": True,
                "error": None
            }
            
        except Exception as e:
            # Log error with context
            log_error(e, {
                "service": "gemini",
                "operation": "generate_threads",
                "transcript_length": len(transcript) if transcript else 0
            })
            
            print(f"Gemini thread generation error: {e}")
            return {
                "threads": [],
                "success": False,
                "error": str(e)
            }

# Global service instance
gemini_service = GeminiService()
