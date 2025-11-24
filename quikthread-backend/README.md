# QuikThread Backend - Python FastAPI

A Python FastAPI backend for QuikThread - converts audio/video content to viral X (Twitter) threads using AI.

## Features

- **Audio/Video Transcription** - Deepgram API integration
- **AI Thread Generation** - Google Gemini API for viral X threads
- **Firebase Integration** - Authentication, Firestore, Storage
- **User Management** - Tier-based quotas (Free, Pro, Business)
- **Twitter/X Posting** - Direct thread posting for Pro+ users
- **Analytics Dashboard** - Performance metrics for Business users
- **Webhook Integration** - Polar.sh payment processing

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   - Copy `.env` and add your API keys
   - Download Firebase service account key as `serviceAccountKey.json`

3. **Run Server**
   ```bash
   python main.py
   ```

4. **Test API**
   - Visit: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/health` - API health check

## Environment Variables

- `FIREBASE_CREDENTIALS_PATH` - Path to Firebase service account key
- `DEEPGRAM_API_KEY` - Deepgram transcription API key
- `GEMINI_API_KEY` - Google Gemini AI API key
- `TWITTER_API_KEY` - Twitter API credentials (optional)
- `POLAR_WEBHOOK_SECRET` - Polar.sh webhook secret (optional)

## Development

This is Step 1 of the FastAPI backend build. More features will be added in subsequent steps.
