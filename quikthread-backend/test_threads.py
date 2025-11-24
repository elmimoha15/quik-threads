import requests
import json

# Test transcript
test_transcript = """
Hello everyone, today I want to talk about the future of artificial intelligence 
and how it's transforming the way we work and live. AI is no longer just a concept 
from science fiction - it's here, it's real, and it's changing everything.

First, let's talk about productivity. AI tools are helping people work smarter, 
not harder. From writing assistance to code generation, these tools are becoming 
essential parts of our daily workflows.

Second, AI is democratizing access to expertise. You no longer need to be an expert 
in every field. AI can help you understand complex topics, make better decisions, 
and solve problems faster than ever before.

Third, the creative possibilities are endless. AI is helping artists, musicians, 
and creators push the boundaries of what's possible. It's not replacing creativity - 
it's amplifying it.

But with great power comes great responsibility. We need to think carefully about 
ethics, privacy, and the impact of AI on society. The future is bright, but we 
need to build it thoughtfully.

Thank you for listening, and I hope this inspires you to explore the amazing 
world of AI and see how it can transform your life and work.
"""

# API endpoint
url = "http://localhost:8000/api/generate-threads"

# Request payload
payload = {
    "transcript": test_transcript
}

# Headers (you'll need a valid Firebase token for authentication)
headers = {
    "Content-Type": "application/json",
    # "Authorization": "Bearer YOUR_FIREBASE_TOKEN_HERE"  # Uncomment and add token for auth
}

print("Testing thread generation endpoint...")
print(f"URL: {url}")
print(f"Transcript length: {len(test_transcript)} characters")
print("\n" + "="*80 + "\n")

try:
    # Note: This will fail without authentication, but we can test the endpoint structure
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print("\nResponse Body:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        print("\n✅ SUCCESS! Thread generation completed.")
        threads = response.json().get("threads", [])
        print(f"\nGenerated {len(threads)} thread options:")
        for i, thread in enumerate(threads, 1):
            print(f"\n--- Thread Option {i} ---")
            print(f"Hook: {thread.get('hook', 'N/A')}")
            print(f"Number of tweets: {len(thread.get('tweets', []))}")
            for j, tweet in enumerate(thread.get('tweets', []), 1):
                print(f"  Tweet {j}: {tweet[:80]}..." if len(tweet) > 80 else f"  Tweet {j}: {tweet}")
    elif response.status_code == 401:
        print("\n⚠️  Authentication required. Please add a valid Firebase token to test.")
    else:
        print(f"\n❌ Error: {response.json().get('detail', 'Unknown error')}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Request failed: {str(e)}")
except Exception as e:
    print(f"❌ Unexpected error: {str(e)}")
