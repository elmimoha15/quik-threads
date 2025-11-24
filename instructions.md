# QuikThread Backend - Python FastAPI Build Guide

**Build this step-by-step. Complete each step fully before moving to the next.**

---

## **STEP 1: Initial FastAPI Setup**

Create a Python FastAPI project with this structure:

```
quikthread-backend/
├── main.py
├── requirements.txt
├── .env
├── config/
│   ├── __init__.py
│   └── settings.py
└── README.md
```

**What to do:**
1. Create all folders and files listed above
2. In `requirements.txt`, add: fastapi, uvicorn[standard], python-dotenv, pydantic, pydantic-settings
3. In `.env`, add placeholder environment variables for Firebase credentials path, Deepgram API key, and Gemini API key
4. In `config/settings.py`, create a Settings class using pydantic-settings to load environment variables
5. In `main.py`, create a basic FastAPI app with CORS middleware enabled, a root endpoint returning "QuikThread API is running", and a health check endpoint

**How to test:**
- Run `pip install -r requirements.txt`
- Run `python main.py`
- Visit `http://localhost:8000` - should see the welcome message
- Visit `http://localhost:8000/docs` - should see FastAPI auto-generated documentation

**✅ Confirm this works before Step 2**

---

## **STEP 2: Firebase Integration**

Add Firebase Admin SDK for authentication, Firestore database, and Storage.

**What to do:**
1. Add `firebase-admin` to requirements.txt
2. Download your Firebase service account key JSON from Firebase Console and save it in the project root
3. Create `config/firebase.py` that:
   - Initializes Firebase Admin SDK with the credentials
   - Creates a Firestore client (db)
   - Creates a Storage bucket client
   - Has a function `verify_token(token)` that verifies Firebase ID tokens and returns user_id
   - Has a function `get_user_profile(user_id)` that fetches user data from Firestore `/users/{userId}`
   - Has a function `create_user_profile(user_id, email)` that creates a new user document with fields: userId, email, tier='free', creditsUsed=0, maxCredits=2, maxDuration=1800, features={analytics: false, postToX: false}

4. Create `middleware/auth.py` that:
   - Defines an async function `get_current_user()` that extracts the Authorization header
   - Removes "Bearer " prefix from the token
   - Calls `verify_token()` to validate and extract user_id
   - Raises 401 HTTPException if invalid

5. Update `main.py` to add a test endpoint `/api/users/me` that uses the auth dependency and returns the user profile

**How to test:**
- Restart the server
- From your frontend, get a Firebase ID token
- Call `GET /api/users/me` with header `Authorization: Bearer <token>`
- Should return user profile or 404

**✅ Confirm authentication works before Step 3**

---

## **STEP 3: Deepgram Transcription Service**

Create a service that takes a Firebase Storage URL (or any audio/video URL) and returns the transcription.

**What to do:**
1. Add `deepgram-sdk` and `httpx` to requirements.txt
2. Create `services/deepgram_service.py` with a class `DeepgramService`:
   - Initialize with Deepgram API key from settings
   - Method `transcribe_from_url(audio_url: str)` that:
     - Configures Deepgram with options: model="nova-2", smart_format=True, punctuate=True, diarize=True, language="en"
     - Calls Deepgram's prerecorded API with the URL
     - Extracts transcript text, duration, and word count
     - Returns dict with: transcript, duration, word_count, success=True
     - On error, returns success=False with error message

3. Create `models/transcription.py` with Pydantic models:
   - `TranscriptionRequest`: has audio_url field
   - `TranscriptionResponse`: has transcript, duration, word_count, success, error fields

4. Create `routes/transcription.py`:
   - POST endpoint `/api/transcribe` that:
     - Uses auth middleware
     - Accepts TranscriptionRequest
     - Calls deepgram_service.transcribe_from_url()
     - Returns TranscriptionResponse

5. Register the transcription router in `main.py`

**How to test:**
- Upload a test audio file to Firebase Storage and get its public/signed URL
- Call `POST /api/transcribe` with body: `{"audio_url": "your_url_here"}`
- Should return the transcript text

**✅ Confirm transcription works before Step 4**

---

## **STEP 4: Gemini Thread Generation Service**

Create a service that takes a transcript and generates 5 viral X (Twitter) thread options using Google Gemini.

**What to do:**
1. Add `google-generativeai` to requirements.txt
2. Create `services/gemini_service.py` with a class `GeminiService`:
   - Initialize with Gemini API key from settings
   - Configure the model to use "gemini-2.0-flash-exp"
   - Method `generate_threads(transcript: str)` that:
     - Creates a prompt instructing the model to generate 5 viral X thread options
     - Each thread should have 5-8 tweets
     - First tweet must grab attention (question, bold claim, or story)
     - Each tweet max 270 characters
     - Use emojis and line breaks
     - End with call-to-action
     - Request JSON output format: `[{"threadNumber": 1, "hook": "...", "tweets": ["tweet1", "tweet2", ...]}]`
     - Sets generation config: temperature=0.8, max_output_tokens=2000
     - Sends the prompt to Gemini API
     - Parses the JSON response (strip any markdown formatting like ```json)
     - Validates each tweet is ≤280 characters, truncates if needed
     - Returns array of thread objects
     - On error, returns error message with success=False

3. Create `models/threads.py` with:
   - `ThreadGenerationRequest`: has transcript field
   - `Thread`: has threadNumber, hook, tweets (list of strings)
   - `ThreadGenerationResponse`: has threads (list of Thread objects), success, error

4. Create `routes/threads.py`:
   - POST endpoint `/api/generate-threads` that:
     - Uses auth middleware
     - Accepts ThreadGenerationRequest
     - Calls gemini_service.generate_threads()
     - Returns ThreadGenerationResponse

5. Register the threads router in `main.py`

**How to test:**
- Call `POST /api/generate-threads` with body: `{"transcript": "your transcript text here"}`
- Should return 5 thread options in JSON format with properly formatted tweets

**✅ Confirm thread generation works before Step 5**

---

## **STEP 5: Main Processing Workflow**

Create the main endpoint that orchestrates: upload → transcribe → generate threads.

**What to do:**
1. Create `models/job.py` with:
   - `ProcessRequest`: has type ("upload" or "url"), fileUrl (optional), contentUrl (optional)
   - `JobStatus`: has jobId, status, progress, type, duration, threads, error, createdAt, completedAt

2. Create `services/job_service.py` with a class `JobService`:
   - Method `create_job(user_id, request_data)` that:
     - Generates a unique jobId
     - Creates a document in Firestore `/jobs/{jobId}` with: userId, status='processing', progress=0, type, createdAt
     - Returns jobId
   
   - Method `update_job_progress(job_id, progress, status)` that updates the job document
   
   - Method `complete_job(job_id, threads, duration)` that:
     - Updates job with: status='completed', progress=100, threads, duration, completedAt
     - Increments user's creditsUsed by 1 in Firestore
   
   - Method `fail_job(job_id, error_message)` that updates job with: status='failed', error, completedAt

3. Create `routes/process.py`:
   - POST endpoint `/api/process` that:
     - Uses auth middleware
     - Checks user quota (creditsUsed < maxCredits)
     - If quota exceeded, return 429 error
     - Accepts ProcessRequest
     - Calls job_service.create_job()
     - Returns jobId immediately
     - Starts background task (using BackgroundTasks) that:
       1. Updates progress to 25, status='transcribing'
       2. Calls deepgram_service.transcribe_from_url() with the audio URL
       3. Updates progress to 75, status='generating'
       4. Calls gemini_service.generate_threads() with the transcript
       5. Calls job_service.complete_job() with threads and duration
       6. On any error, calls job_service.fail_job()
   
   - GET endpoint `/api/jobs/{job_id}` that:
     - Uses auth middleware
     - Fetches job from Firestore
     - Verifies job belongs to current user (else 403)
     - Returns JobStatus
   
   - GET endpoint `/api/jobs` that:
     - Uses auth middleware
     - Lists all jobs for current user (order by createdAt desc, limit 50)
     - Returns list of JobStatus

4. Register the process router in `main.py`

**How to test:**
- Call `POST /api/process` with body: `{"type": "upload", "fileUrl": "your_firebase_storage_url"}`
- Should return jobId immediately
- Poll `GET /api/jobs/{jobId}` every 3 seconds
- Should see progress update: 0 → 25 → 75 → 100
- Final status should be 'completed' with threads array

**✅ Confirm end-to-end workflow works before Step 6**

---

## **STEP 6: User Management & Quota System**

Create endpoints for user profile management and enforce tier-based quotas.

**What to do:**
1. Create `models/user.py` with:
   - `UserProfile`: has userId, email, tier, creditsUsed, maxCredits, maxDuration, features
   - `QuotaInfo`: has creditsUsed, maxCredits, remaining, tier, resetDate

2. Create `services/user_service.py` with a class `UserService`:
   - Method `get_or_create_user(user_id, email)` that:
     - Tries to get user from Firestore `/users/{userId}`
     - If doesn't exist, calls create_user_profile()
     - Returns user profile
   
   - Method `check_quota(user_id)` that:
     - Gets user profile
     - Checks if resetDate has passed (monthly reset)
     - If yes, resets creditsUsed to 0 and updates resetDate to first day of next month
     - Returns True if creditsUsed < maxCredits, else False
   
   - Method `increment_credits(user_id)` that:
     - Increments creditsUsed by 1 in Firestore
   
   - Method `get_quota_info(user_id)` that:
     - Returns QuotaInfo with current usage stats

3. Create `middleware/check_quota.py`:
   - Function `check_user_quota()` that:
     - Depends on get_current_user
     - Calls user_service.check_quota()
     - If quota exceeded, raises 429 HTTPException with upgrade message
     - Returns user_id if quota available

4. Create `routes/users.py`:
   - POST endpoint `/api/users/init` that:
     - Uses auth middleware
     - Gets user email from Firebase Auth
     - Calls user_service.get_or_create_user()
     - Returns user profile
   
   - GET endpoint `/api/users/profile` that:
     - Uses auth middleware
     - Calls user_service.get_or_create_user()
     - Returns user profile
   
   - GET endpoint `/api/users/quota` that:
     - Uses auth middleware
     - Calls user_service.get_quota_info()
     - Returns quota information

5. Update `/api/process` endpoint to use `check_user_quota` middleware before processing

6. Register the users router in `main.py`

**How to test:**
- Call `POST /api/users/init` - should create user profile in Firestore
- Call `GET /api/users/quota` - should return credits remaining
- Submit jobs until quota is reached
- Next job should return 429 error with upgrade message

**✅ Confirm quota system works before Step 7**

---

## **STEP 7: Polar.sh Webhook Integration**

Create webhook handler for Polar.sh payment events to upgrade/downgrade user tiers.

**What to do:**
1. Add `POLAR_WEBHOOK_SECRET` to .env and settings.py
2. Create `services/polar_service.py` with a class `PolarService`:
   - Method `verify_signature(payload, signature)` that:
     - Uses HMAC-SHA256 to verify webhook signature
     - Returns True if valid, False if invalid
   
   - Method `handle_checkout_success(event_data)` that:
     - Extracts customer email and product_id
     - Finds user in Firestore by email
     - If product_id is 'prod_pro':
       - Updates user: tier='pro', maxCredits=30, maxDuration=3600, features={postToX: true, analytics: false}
     - If product_id is 'prod_business':
       - Updates user: tier='business', maxCredits=100, maxDuration=3600, features={postToX: true, analytics: true}
   
   - Method `handle_subscription_cancelled(event_data)` that:
     - Finds user by customer ID or email
     - Downgrades user: tier='free', maxCredits=2, maxDuration=1800, features={postToX: false, analytics: false}

3. Create `routes/webhooks.py`:
   - POST endpoint `/api/webhooks/polar` (NO auth middleware):
     - Extracts signature from headers
     - Verifies signature with polar_service
     - If invalid, returns 401
     - Parses event type from payload
     - Calls appropriate handler method
     - Logs event to Firestore `/webhook-logs` collection
     - Returns 200 immediately (don't make Polar wait)

4. Register the webhooks router in `main.py`

**How to test:**
- Use Polar.sh webhook testing tool to send test events
- Verify user tier updates correctly in Firestore
- Check `/webhook-logs` collection for logged events

**✅ Confirm webhook integration works before Step 8**

---

## **STEP 8: Twitter/X Posting Feature (Pro & Business Only)**

Create service to post generated threads directly to X (Twitter).

**What to do:**
1. Add `tweepy` to requirements.txt
2. Add Twitter API credentials to .env: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`
3. Create `services/twitter_service.py` with a class `TwitterService`:
   - Initialize with Twitter API v2 client using credentials
   - Method `post_thread(tweets: list)` that:
     - Posts first tweet
     - Gets the tweet ID from response
     - For each remaining tweet:
       - Posts as reply to previous tweet
       - Updates previous tweet ID
     - Returns thread URL and list of tweet IDs
     - Handles rate limits (max 50 tweets per 15 minutes)
     - On error, returns error message

4. Create `middleware/check_feature.py`:
   - Function `check_feature_access(feature_name: str)` that:
     - Depends on get_current_user
     - Gets user profile
     - Checks if user.features[feature_name] is True
     - If False, raises 403 HTTPException with upgrade message
     - Returns user_id if feature available

5. Create `routes/twitter.py`:
   - POST endpoint `/api/twitter/post` that:
     - Uses auth middleware and check_feature_access('postToX')
     - Accepts: jobId, threadIndex
     - Gets job from Firestore `/jobs/{jobId}`
     - Verifies job belongs to user (else 403)
     - Verifies job status is 'completed' (else 400)
     - Gets selected thread from job.threads[threadIndex]
     - Calls twitter_service.post_thread()
     - Saves post record to Firestore `/posts/{postId}`:
       - userId, jobId, threadIndex, tweetIds, threadUrl, postedAt
     - Returns success with thread URL

6. Register the twitter router in `main.py`

**How to test:**
- Free user tries to post → 403 error with upgrade message
- Pro user posts a thread → thread appears on X with correct threading
- Check `/posts` collection for saved post record

**✅ Confirm Twitter posting works before Step 9**

---

## **STEP 9: Analytics Dashboard (Business Only)**

Create analytics service to fetch and aggregate X post performance metrics.

**What to do:**
1. Create `services/analytics_service.py` with a class `AnalyticsService`:
   - Initialize with Twitter API v2 client
   - Method `get_user_analytics(user_id)` that:
     - Queries Firestore `/posts` where userId matches
     - For each post, fetches tweet metrics from Twitter API:
       - impressions, likes, retweets, replies, bookmarks
     - Calculates aggregated metrics:
       - totalImpressions (sum of all impressions)
       - totalReach (estimated unique views)
       - totalLikes (sum)
       - totalEngagements (sum of likes + retweets + replies)
       - weekOverWeekGrowth (percentage change from last week)
       - postsThisWeek (count)
       - engagementTrend (daily engagement for last 7 days)
       - topPosts (top 5 by engagement)
     - Returns analytics object
   
   - Method `cache_analytics(user_id, analytics_data)` that:
     - Saves to Firestore `/analytics-cache/{userId}` with timestamp
   
   - Method `get_cached_analytics(user_id)` that:
     - Fetches from cache
     - Returns data if less than 1 hour old, else returns None

2. Create `models/analytics.py` with:
   - `AnalyticsData`: has totalImpressions, totalReach, totalLikes, totalEngagements, weekOverWeekGrowth, postsThisWeek, engagementTrend, topPosts
   - `EngagementPoint`: has date, engagements
   - `TopPost`: has title, engagement, threadUrl

3. Create `routes/analytics.py`:
   - GET endpoint `/api/analytics` that:
     - Uses auth middleware and check_feature_access('analytics')
     - Checks cache first with analytics_service.get_cached_analytics()
     - If cache hit and fresh, returns cached data
     - Else calls analytics_service.get_user_analytics()
     - Caches the results
     - Returns AnalyticsData

4. Register the analytics router in `main.py`

**How to test:**
- Free/Pro user tries to access → 403 error with "Upgrade to Business" message
- Business user with posts → receives analytics data with metrics
- Second call within 1 hour → returns cached data (faster response)

**✅ Confirm analytics works before Step 10**

---

## **STEP 10: Error Logging & Monitoring**

Create centralized error logging system for debugging and monitoring.

**What to do:**
1. Create `utils/logger.py` with:
   - Function `log_error(error, context)` that:
     - Saves to Firestore `/error-logs` collection:
       - message, stack, context (userId, jobId, service, etc.), timestamp
     - Also prints to console for Cloud Logging
   
   - Function `log_event(event_type, data)` that:
     - Saves general events to Firestore `/event-logs`
     - For tracking: user signups, job completions, posts created, etc.

2. Update all service files to wrap operations in try-except:
   - In `deepgram_service.py`: catch errors and call log_error with context
   - In `gemini_service.py`: catch errors and call log_error
   - In `twitter_service.py`: catch errors and call log_error
   - In `job_service.py`: catch errors and call log_error

3. Create Firestore indexes:
   - `/error-logs`: index on timestamp (desc)
   - `/event-logs`: index on timestamp (desc)

**How to test:**
- Cause an intentional error (e.g., invalid Deepgram URL)
- Check Firestore `/error-logs` collection
- Verify error details are logged with proper context

**✅ Confirm error logging works before Step 11**

---

## **STEP 11: File Upload Endpoint**

Create endpoint to handle direct file uploads to Firebase Storage.

**What to do:**
1. Add `python-multipart` to requirements.txt
2. Create `services/storage_service.py` with a class `StorageService`:
   - Method `upload_file(user_id, file, filename)` that:
     - Validates file type (mp3, mp4, m4a, wav, webm only)
     - Validates file size (1MB min, 500MB max)
     - Generates unique filename with timestamp
     - Uploads to Firebase Storage: `/users/{userId}/uploads/{filename}`
     - Generates signed URL (valid for 2 hours)
     - Returns: fileUrl, fileName, size
   
   - Method `get_audio_duration(file)` that:
     - Uses ffprobe or similar to extract audio duration
     - Returns duration in seconds

3. Create `routes/upload.py`:
   - POST endpoint `/api/upload` that:
     - Uses auth middleware (NO quota check yet)
     - Accepts multipart file upload
     - Gets user profile to check maxDuration limit
     - Calls storage_service.get_audio_duration()
     - Validates duration against user's maxDuration:
       - Free: reject if > 1800 seconds (30 min)
       - Pro/Business: reject if > 3600 seconds (60 min)
     - If duration valid, calls storage_service.upload_file()
     - Returns upload response with fileUrl and duration

4. Register the upload router in `main.py`

**How to test:**
- Free user uploads 31-minute file → rejected with "Upgrade to Pro" message
- Free user uploads 20-minute file → success, returns signed URL
- Pro user uploads 55-minute file → success

**✅ Confirm file upload works before Step 12**

---

## **STEP 12: Firestore Security Rules**

Create security rules to protect data access.

**What to do:**
1. Create `firestore.rules` file in project root:
   - `/users/{userId}`: allow read/write if request.auth.uid == userId
   - `/jobs/{jobId}`: allow read if resource.data.userId == request.auth.uid
   - `/posts/{postId}`: allow read if resource.data.userId == request.auth.uid
   - `/analytics-cache/{userId}`: allow read if request.auth.uid == userId
   - `/error-logs`, `/event-logs`, `/webhook-logs`: deny all (backend only)
   - All other paths: deny by default

2. Create `storage.rules` file:
   - `/users/{userId}/uploads/{filename}`: allow read/write if request.auth.uid == userId
   - `/users/{userId}/fetched/{filename}`: allow read if request.auth.uid == userId, write: false (backend only)
   - All other paths: deny

3. Deploy rules:
   - Use Firebase CLI: `firebase deploy --only firestore:rules`
   - Use Firebase CLI: `firebase deploy --only storage`

**How to test:**
- Try accessing another user's job from frontend → denied
- Try reading another user's files from Storage → denied
- Try writing to `/error-logs` from frontend → denied

**✅ Confirm security rules work before Step 13**

---

## **STEP 13: Cleanup & Optimization**

Add scheduled tasks and optimizations for production.

**What to do:**
1. Create `services/cleanup_service.py` with a class `CleanupService`:
   - Method `delete_old_files()` that:
     - Queries Firestore `/jobs` where completedAt < 24 hours ago
     - For each job, deletes associated Storage files
     - Keeps job documents for history
   
   - Method `cleanup_expired_cache()` that:
     - Queries `/analytics-cache` where timestamp < 24 hours ago
     - Deletes expired cache entries

2. Create scheduled endpoint or use Cloud Scheduler:
   - Runs cleanup_service.delete_old_files() daily
   - Runs cleanup_service.cleanup_expired_cache() daily

3. Add rate limiting:
   - Create `middleware/rate_limit.py`:
     - Tracks requests per user per time window
     - Max 100 requests per 15 minutes per user
     - Returns 429 if exceeded

4. Optimize Firestore queries:
   - Create composite indexes for common queries:
     - `/jobs`: userId + createdAt (desc)
     - `/posts`: userId + postedAt (desc)
     - `/error-logs`: timestamp (desc)

**How to test:**
- Wait 24 hours or manually trigger cleanup
- Verify old files are deleted from Storage
- Verify job documents remain in Firestore

**✅ Confirm cleanup works before Step 14**

---

## **STEP 14: Deployment Setup**

Prepare the backend for production deployment.

**What to do:**
1. Create `Dockerfile`:
   - Use Python 3.11 base image
   - Copy requirements.txt and install dependencies
   - Copy all application code
   - Expose port 8000
   - Run with uvicorn

2. Create `.dockerignore`:
   - Exclude: __pycache__, .env, serviceAccountKey.json, .git, venv

3. Create `docker-compose.yml` for local testing:
   - Service for the FastAPI app
   - Environment variables loaded from .env

4. Update `main.py` for production:
   - Set CORS origins to specific domains (not "*")
   - Enable HTTPS-only cookies if using sessions
   - Add startup event to verify Firebase connection

5. Create deployment documentation:
   - Environment variables needed
   - Firebase setup steps
   - API ## **STEP 6: User Management & Quota System**

Create endpoints for user profile management and enforce tier-based quotas.

**What to do:**
1. Create `models/user.py` with:
   - `UserProfile`: has userId, email, tier, creditsUsed, maxCredits, maxDuration, features
   - `QuotaInfo`: has creditsUsed, maxCredits, remaining, tier, resetDate

2. Create `services/user_service.py` with a class `UserService`:
   - Method `get_or_create_user(user_id, email)` that:
     - Tries to get user from Firestore `/users/{userId}`
     - If doesn't exist, calls create_user_profile()
     - Returns user profile
   
   - Method `check_quota(user_id)` that:
     - Gets user profile
     - Checks if resetDate has passed (monthly reset)
     - If yes, resets creditsUsed to 0 and updates resetDate to first day of next month
     - Returns True if creditsUsed < maxCredits, else False
   
   - Method `increment_credits(user_id)` that:
     - Increments creditsUsed by 1 in Firestore
   
   - Method `get_quota_info(user_id)` that:
     - Returns QuotaInfo with current usage stats

3. Create `middleware/check_quota.py`:
   - Function `check_user_quota()` that:
     - Depends on get_current_user
     - Calls user_service.check_quota()
     - If quota exceeded, raises 429 HTTPException with upgrade message
     - Returns user_id if quota available

4. Create `routes/users.py`:
   - POST endpoint `/api/users/init` that:
     - Uses auth middleware
     - Gets user email from Firebase Auth
     - Calls user_service.get_or_create_user()
     - Returns user profile
   
   - GET endpoint `/api/users/profile` that:
     - Uses auth middleware
     - Calls user_service.get_or_create_user()
     - Returns user profile
   
   - GET endpoint `/api/users/quota` that:
     - Uses auth middleware
     - Calls user_service.get_quota_info()
     - Returns quota information

5. Update `/api/process` endpoint to use `check_user_quota` middleware before processing

6. Register the users router in `main.py`

**How to test:**
- Call `POST /api/users/init` - should create user profile in Firestore
- Call `GET /api/users/quota` - should return credits remaining
- Submit jobs until quota is reached
- Next job should return 429 error with upgrade message
est:**
- Build Docker image: `docker build -t quikthread-api .`
- Run container: `docker run -p 8000:8000 quikthread-api`
- Test all endpoints still work

**✅ Confirm Docker deployment works before Step 15**

---

## **STEP 15: Final Integration Testing**

Test complete end-to-end workflows with all features.

**What to do:**
1. Create `tests/` directory with test scripts
2. Test complete workflows:
   
   **Free User Flow:**
   - Register/login → profile created with tier='free'
   - Upload 25-min file → success
   - Process job → transcription + threads generated
   - Try to upload 31-min file → rejected
   - Complete 2 jobs → success
   - Try 3rd job → quota exceeded (429)
   - Try to post to X → 403 (feature not available)
   - Try to access analytics → 403 (feature not available)
   
   **Pro User Flow:**
   - Simulate Polar webhook with prod_pro purchase
   - Verify tier upgraded to 'pro'
   - Upload 55-min file → success
   - Process job → success
   - Post thread to X → thread posted successfully
   - Try to access analytics → 403 (Business only)
   - Complete 30 jobs → all succeed
   - Try 31st job → quota exceeded
   
   **Business User Flow:**
   - Simulate Polar webhook with prod_business purchase
   - Verify tier upgraded to 'business'
   - Process jobs and post to X
   - Access analytics → receive aggregated metrics
   - Verify analytics caching (2nd call faster)
   - Complete 100 jobs → all succeed
   
   **Edge Cases:**
   - Invalid audio URL → proper error message
   - Deepgram API failure → job marked as failed
   - Gemini API failure → job marked as failed
   - Twitter API rate limit → proper error handling
   - Expired Firebase token → 401 error
   - Job belonging to different user → 403 error

3. Load testing:
   - Submit 10 concurrent jobs → all process successfully
   - Verify no race conditions on quota checking
   - Verify background tasks complete properly

**How to test:**
- Run all test scripts
- Manually verify each workflow from frontend
- Check Firestore for data consistency
- Check error logs for any unexpected issues

**✅ All tests pass → Backend complete!**

---

## **Final Checklist**

Before going live:

- [ ] All environment variables set in production
- [ ] Firebase service account key secured
- [ ] Firestore security rules deployed
- [ ] Storage security rules deployed
- [ ] Firestore indexes created
- [ ] API rate limits configured
- [ ] CORS origins restricted to production domains
- [ ] Polar webhook URL configured
- [ ] Twitter API credentials valid
- [ ] Error logging working
- [ ] Cleanup tasks scheduled
- [ ] Documentation complete
- [ ] All endpoints tested
- [ ] Load testing passed

**Backend is production-ready! 🚀**