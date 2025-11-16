QuikThread Backend - UPDATED with Features & Privileges
Feature Access Matrix
FeatureFreePro ($20)Business ($49)Generations2/month30/month100/monthMax Duration30min60min60minAnalytics Dashboard❌❌✅Post to X Directly❌✅✅

STEP 1: Project Setup (MODIFIED)
Create Firebase Functions Node.js 20 project:

Structure:
functions/
├── index.js
├── config/
│   ├── firebase.js
│   └── constants.js (NEW - tier config)
├── middleware/
│   ├── auth.js
│   ├── checkQuota.js
│   └── checkFeature.js (NEW)
├── services/
│   ├── deepgram.js
│   ├── gemini.js
│   ├── urlFetcher.js
│   └── twitter.js (NEW)
├── api/
│   ├── upload.js
│   ├── process.js
│   ├── jobs.js
│   ├── users.js
│   ├── analytics.js (NEW)
│   └── twitter.js (NEW)
└── webhooks/
    └── polar.js

Dependencies:
express, cors, busboy, firebase-admin, firebase-functions
@deepgram/sdk, @google/generative-ai, ytdl-core, twitter-api-v2

.env:
DEEPGRAM_API_KEY=
GEMINI_API_KEY=
POLAR_WEBHOOK_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

In config/constants.js export:
TIER_CONFIG = {
  free: { maxCredits: 2, maxDuration: 1800, analytics: false, postToX: false },
  pro: { maxCredits: 30, maxDuration: 3600, analytics: false, postToX: true },
  business: { maxCredits: 100, maxDuration: 3600, analytics: true, postToX: true }
}
Check: npm install completes, constants.js exports correctly

STEP 2: Firebase Config + Auth Middleware (COMBINED)
Create config/firebase.js:
- Initialize admin SDK
- Export: db, storage, auth, getTimestamp, generateId

Create middleware/auth.js:
- verifyAuth(req, res, next) extracts Bearer token
- Verifies with admin.auth().verifyIdToken()
- Attaches req.userId
- Returns 401 if invalid

Apply auth to all /api/* except /api/webhooks/*
Check: Call any API without token → 401

STEP 3: User Management with Tier Config
Create api/users.js:

POST /api/users/init:
- Create /users/{userId} if not exists:
  {
    userId,
    email,
    tier: 'free',
    creditsUsed: 0,
    maxCredits: 2,
    maxDuration: 1800,
    resetDate: first day next month,
    features: { analytics: false, postToX: false },
    createdAt
  }

GET /api/users/profile:
- Return user doc (create if missing)

Helper: getUserProfile(userId) - export for reuse
Check: Login → user doc created with tier='free'

STEP 4: Feature Access Middleware (NEW)
Create middleware/checkFeature.js:

Export checkFeature(featureName):
  Returns middleware function that:
  - Gets user profile
  - Checks user.features[featureName] === true
  - If false: return 403 { error: 'Upgrade to Pro/Business for this feature', feature: featureName }
  - If true: call next()

Example usage: 
app.get('/api/analytics', auth, checkFeature('analytics'), handler)
Check: Free user calls analytics endpoint → 403 error

STEP 5: Quota Checker (UPDATED)
Create middleware/checkQuota.js:

checkQuota(req, res, next):
- Get user profile
- Check if resetDate < today: reset creditsUsed=0, update resetDate
- Check creditsUsed < maxCredits
- If no: return 429 { error: 'Monthly limit reached', tier, maxCredits, upgradeUrl }
- If yes: next()

Apply ONLY to POST /api/process
Check: Set creditsUsed = maxCredits → 429 on process

STEP 6: File Upload with Tier-Based Duration Check
Create api/upload.js:

POST /api/upload (auth + NO quota check yet):
- Parse multipart with busboy (500MB max)
- Validate: mp3, mp4, m4a, wav, webm only
- Validate: 1MB-500MB size
- Extract duration with get-audio-duration
- Get user profile, check duration <= user.maxDuration
  - Free: reject if > 30min
  - Pro/Business: reject if > 60min
- Upload to /users/{userId}/uploads/{timestamp}-{filename}
- Return { fileUrl, fileName, duration, size }

NO credit increment yet
Check: Free user uploads 31min file → rejected with upgrade message

STEP 7: URL Fetcher (SAME)
Create services/urlFetcher.js:

fetchFromUrl(url, userId, maxDuration):
- YouTube: ytdl-core audioonly stream
- Other: HEAD check, download if audio/video
- Check duration <= maxDuration (passed from user profile)
- Save to /users/{userId}/fetched/{timestamp}.m4a
- Return { storagePath, duration }
- Timeout: 5min
Check: YouTube 61min → rejected for Pro user

STEP 8: Deepgram (SAME)
Create services/deepgram.js:

transcribe(storageFilePath):
- Get signed URL (1hr expiry)
- Call Deepgram prerecorded API
- Model: nova-2, smart_format, punctuate, diarize
- Return { transcript, wordCount, duration }
- Retry once on failure
Check: Transcribe test file → get text back

STEP 9: Gemini (SAME)
Create services/gemini.js:

generateThreads(transcript):
- Model: gemini-2.0-flash-exp
- Prompt: Generate 5 viral X threads, 5-8 tweets each, max 270 chars
- Return JSON: [{ threadNumber, hook, tweets[] }]
- Validate tweet lengths, truncate if needed
Check: Sample transcript → 5 threads JSON

STEP 10: Main Process Endpoint (SAME)
Create api/process.js:

POST /api/process (auth + quota middleware):
Body: { type: 'upload'|'url', fileUrl?, contentUrl? }

1. Create /jobs/{jobId}: status='processing', progress=0
2. Return { jobId } immediately
3. Async process:
   - Fetch content (progress=25)
   - Transcribe (progress=50)
   - Generate threads (progress=75)
   - Complete (progress=100), save threads
   - Increment user.creditsUsed by 1
4. On error: status='failed', save error

Auto-delete files after 24hrs
Check: Submit → jobId returned, poll for completion

STEP 11: Job Status (SAME)
Create api/jobs.js:

GET /api/jobs/:jobId (auth):
- Verify job.userId === req.userId (else 403)
- Return { jobId, status, progress, threads, error, createdAt, completedAt }

GET /api/jobs (auth):
- List user's jobs (limit 50, order by createdAt desc)
Check: Poll job status → see progress updates

STEP 12: Twitter Posting Service (NEW)
Create services/twitter.js:

Import twitter-api-v2, initialize with credentials from env

Export async postThread(userId, threadTweets):
- Validate user has postToX feature (throw error if not)
- Post first tweet with client.v2.tweet(threadTweets[0])
- Get tweetId from response
- For remaining tweets:
  - Post as reply with reply: { in_reply_to_tweet_id: previousTweetId }
  - Update previousTweetId
- Return { threadUrl, tweetIds[] }
- On error: throw with descriptive message

Rate limit: max 50 tweets per 15min (Twitter API limit)
Check: Call with test tweets → thread posted to X

STEP 13: Twitter Post Endpoint (NEW)
Create api/twitter.js:

POST /api/twitter/post (auth + checkFeature('postToX')):
Body: { jobId, threadIndex }

Handler:
- Get job from /jobs/{jobId}
- Verify job.userId === req.userId (else 403)
- Verify job.status === 'completed' (else 400)
- Get selected thread: threads[threadIndex]
- Call postThread(userId, thread.tweets)
- Save to /posts/{postId}:
  {
    userId,
    jobId,
    threadIndex,
    tweetIds,
    threadUrl,
    postedAt
  }
- Return { success: true, threadUrl }

Free users get 403 with upgrade prompt
Check: Free user tries → 403. Pro user → thread posts successfully

STEP 14: Analytics Service (NEW - Business Only)
Create services/analytics.js:

Export async getUserAnalytics(userId):
- Query /posts collection where userId matches
- For each post, fetch X API analytics:
  - Use client.v2.tweets(tweetIds, { 'tweet.fields': 'public_metrics' })
  - Extract: impressions, likes, retweets, replies
- Calculate:
  - totalImpressions = sum of all
  - totalReach = unique sum
  - totalLikes = sum
  - totalEngagements = sum(likes + retweets + replies)
  - weekOverWeek growth %
- Return aggregated data

Cache results for 1 hour in Firestore /analytics-cache/{userId}
Check: Call with user who has posts → get analytics data

STEP 15: Analytics Endpoint (NEW)
Create api/analytics.js:

GET /api/analytics (auth + checkFeature('analytics')):
- Check cache first: /analytics-cache/{userId}
- If cache < 1hr old: return cached data
- Else: call getUserAnalytics(userId)
- Save to cache with timestamp
- Return:
  {
    totalImpressions,
    totalReach,
    totalLikes,
    totalEngagements,
    weekOverWeekGrowth,
    postsThisWeek,
    engagementTrend: [{ day, engagements }],
    topPosts: [{ title, engagement }]
  }

Free/Pro users get 403 with upgrade to Business prompt
Check: Business user → gets analytics. Free user → 403

STEP 16: Polar Webhook (UPDATED)
Create webhooks/polar.js (NO auth):

POST /webhooks/polar:
- Verify signature with POLAR_WEBHOOK_SECRET
- Handle events:

  checkout.created/updated (status=succeeded):
    productId = event.data.product_id
    email = event.data.email
    
    Find user by email, update:
    if productId === 'prod_pro':
      { tier: 'pro', maxCredits: 30, maxDuration: 3600,
        features: { analytics: false, postToX: true } }
    
    if productId === 'prod_business':
      { tier: 'business', maxCredits: 100, maxDuration: 3600,
        features: { analytics: true, postToX: true } }

  subscription.cancelled:
    { tier: 'free', maxCredits: 2, maxDuration: 1800,
      features: { analytics: false, postToX: false } }

- Return 200 immediately
- Log to /webhook-logs
Check: Test webhook → user tier updates with correct features

STEP 17: Security Rules (UPDATED)
firestore.rules:

/users/{userId}: read/write if auth.uid == userId
/jobs/{jobId}: read if resource.data.userId == auth.uid
/posts/{postId}: read if resource.data.userId == auth.uid
/analytics-cache/{userId}: read if auth.uid == userId
/webhook-logs, /error-logs: deny all

storage.rules:
/users/{userId}/uploads/{file}: read/write if auth.uid == userId
/users/{userId}/fetched/{file}: read if auth.uid == userId

Deploy: firebase deploy --only firestore:rules,storage
Check: Try accessing other user data → denied

STEP 18: Error Logging (SAME)
Create utils/logger.js:

logError(error, context):
- Save to /error-logs: { message, stack, context, timestamp }
- console.error()

Wrap all service try-catch blocks with logError()
Check: Cause error → logged to /error-logs

STEP 19: Cleanup Function (SAME)
exports.cleanupOldFiles = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    - Delete Storage files from jobs completed > 24hrs ago
    - Keep job docs
  });
Check: Manual trigger → old files deleted

STEP 20: Deploy with Secrets
Set secrets:
firebase functions:secrets:set DEEPGRAM_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set POLAR_WEBHOOK_SECRET
firebase functions:secrets:set TWITTER_API_KEY
firebase functions:secrets:set TWITTER_API_SECRET
firebase functions:secrets:set TWITTER_ACCESS_TOKEN
firebase functions:secrets:set TWITTER_ACCESS_SECRET

firebase.json:
{
  "functions": { "source": "functions", "runtime": "nodejs20" },
  "hosting": {
    "rewrites": [{ "source": "/api/**", "function": "api" }]
  }
}

Deploy: firebase deploy
Check: All endpoints live

STEP 21: Polar Products Setup
In Polar.sh:
1. Create products:
   - prod_pro: $20/month
   - prod_business: $49/month
2. Webhook: https://yourproject.web.app/api/webhooks/polar
3. Events: checkout.created, checkout.updated, subscription.cancelled
4. Copy webhook secret
Check: Test purchase → tier upgrades

STEP 22: Twitter Developer Setup
1. Apply for Twitter Developer account (Elevated access needed for posting)
2. Create app in Twitter Developer Portal
3. Generate OAuth 1.0a credentials:
   - API Key & Secret
   - Access Token & Secret (with Read + Write permissions)
4. Set in Firebase secrets

Note: Each user posting requires OAuth. For MVP, use your account credentials.
For production, implement Twitter OAuth flow per user.
Check: Test post with hardcoded credentials → thread posts

Final Testing Checklist
Free Tier:

 2 generations work, 3rd rejected
 31min upload rejected
 Analytics endpoint → 403
 Post to X → 403

Pro Tier:

 30 generations work
 60min upload works
 Post to X works
 Analytics → 403

Business Tier:

 100 generations work
 Analytics works with real data
 Post to X works

General:

 Polar webhook upgrades work
 Credits reset monthly
 Files cleanup after 24hrs