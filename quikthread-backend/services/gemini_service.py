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
    
    async def generate_threads(self, transcript: str, ai_instructions: str = None) -> Dict[str, Any]:
        """
        Generate 6 X post formats from transcript using Gemini
        
        Args:
            transcript: The transcribed text to convert into X posts
            ai_instructions: Optional user instructions for customization (e.g., "drive traffic to my YouTube")
            
        Returns:
            Dict with posts array organized by format, success status, and optional error
        """
        try:
            # Build the user guidance section
            user_guidance = ""
            if ai_instructions and ai_instructions.strip():
                user_guidance = f"""
IMPORTANT - User's Custom Instructions:
{ai_instructions}

Make sure to incorporate these instructions into ALL posts across all formats.
"""

            # Create the prompt for X posts by format
            prompt = f"""
You are an expert social media content creator specializing in viral X (Twitter) posts.

Convert the following transcript into 6 DIFFERENT POST FORMATS. For each format, create 3-4 variations.

{user_guidance}

The 6 formats are:

1. **One-Liner** (3-4 variations)
   - Single punchy sentence
   - 100-150 characters
   - Direct and memorable
   - Example: "The best investment? Yourself. No stock can beat that ROI. 📈"

2. **Hot Take** (3-4 variations)
   - Bold, controversial opinion
   - 150-200 characters
   - Makes people think or debate
   - Example: "Unpopular opinion: Most productivity advice makes you LESS productive. Here's why... 🧵"

3. **Paragraph Post** (3-4 variations)
   - 3-5 sentences
   - 250-270 characters max
   - Well-structured narrative
   - Breaks and emojis for readability
   - Example: "I spent 5 years chasing followers.\n\nThen I realized:\n\nEngagement > Follower count\nValue > Virality\nCommunity > Clout\n\nEverything changed. 🔄"

4. **Mini-Story** (3-4 variations)
   - Short narrative arc (beginning, middle, end)
   - 200-270 characters
   - Personal or relatable
   - Emotional hook
   - Example: "2019: Fired from my job\n2020: Started freelancing\n2021: First $10k month\n2022: Hired my first employee\n2023: 7-figure business\n\nNever waste a crisis. 💪"

5. **Insight** (3-4 variations)
   - Key learning or wisdom
   - 150-220 characters  
   - Actionable takeaway
   - Example: "The difference between amateurs and pros?\n\nAmateurs wait for inspiration.\nPros work on a schedule.\n\nTalent is overrated. Consistency wins. ⏰"

6. **List Post** (3-4 variations)
   - 3-5 bullet points or numbered items
   - 200-270 characters
   - Easy to scan
   - Example: "3 rules I live by:\n\n1. Assume nothing\n2. Question everything\n3. Build relentlessly\n\nSimple, but not easy. 🎯"

Return ONLY a JSON object in this exact format:
{{
  "one_liner": [
    {{"text": "Post text here", "format": "one_liner"}},
    {{"text": "Another variation", "format": "one_liner"}},
    {{"text": "Third variation", "format": "one_liner"}}
  ],
  "hot_take": [
    {{"text": "Hot take text", "format": "hot_take"}},
    {{"text": "Another hot take", "format": "hot_take"}},
    {{"text": "Third hot take", "format": "hot_take"}}
  ],
  "paragraph": [
    {{"text": "Paragraph post text", "format": "paragraph"}},
    {{"text": "Another paragraph", "format": "paragraph"}},
    {{"text": "Third paragraph", "format": "paragraph"}}
  ],
  "mini_story": [
    {{"text": "Story text", "format": "mini_story"}},
    {{"text": "Another story", "format": "mini_story"}},
    {{"text": "Third story", "format": "mini_story"}}
  ],
  "insight": [
    {{"text": "Insight text", "format": "insight"}},
    {{"text": "Another insight", "format": "insight"}},
    {{"text": "Third insight", "format": "insight"}}
  ],
  "list_post": [
    {{"text": "List text", "format": "list_post"}},
    {{"text": "Another list", "format": "list_post"}},
    {{"text": "Third list", "format": "list_post"}}
  ]
}}

Transcript to convert:
{transcript}

Remember: 
- Return ONLY the JSON object, no other text or markdown
- Each post must be 280 characters or less
- Use emojis strategically
- Create 3-4 variations per format
- Make each variation unique and valuable
"""

            # Configure generation settings
            generation_config = genai.types.GenerationConfig(
                temperature=0.8,
                max_output_tokens=3000,
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
                posts_data = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Response text: {response_text}")
                return {
                    "posts": {},
                    "success": False,
                    "error": f"Failed to parse JSON response: {str(e)}"
                }
            
            # Validate and process posts by format
            processed_posts = {
                "one_liner": [],
                "hot_take": [],
                "paragraph": [],
                "mini_story": [],
                "insight": [],
                "list_post": []
            }
            
            for format_key in processed_posts.keys():
                if format_key in posts_data and isinstance(posts_data[format_key], list):
                    for post in posts_data[format_key]:
                        # Handle both dict format {"text": "..."} and plain string
                        if isinstance(post, dict) and "text" in post:
                            text = post["text"]
                        elif isinstance(post, str):
                            text = post
                        else:
                            continue  # Skip invalid format
                        
                        # Truncate if too long
                        if len(text) > 280:
                            text = text[:277] + "..."
                        
                        # Append just the text string
                        processed_posts[format_key].append(text)
            
            # Verify we have posts in each format
            total_posts = sum(len(posts) for posts in processed_posts.values())
            if total_posts < 6:
                return {
                    "posts": processed_posts,
                    "success": False,
                    "error": f"Generated only {total_posts} posts total, expected at least 18"
                }
            
            return {
                "posts": processed_posts,
                "success": True,
                "error": None
            }
            
        except Exception as e:
            # Log error with context
            log_error(e, {
                "service": "gemini",
                "operation": "generate_posts",
                "transcript_length": len(transcript) if transcript else 0
            })
            
            print(f"Gemini post generation error: {e}")
            return {
                "posts": {},
                "success": False,
                "error": str(e)
            }

# Global service instance
gemini_service = GeminiService()
