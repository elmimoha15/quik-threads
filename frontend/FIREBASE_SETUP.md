# Firebase Setup Instructions for QuikThread

## Prerequisites
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication and Firestore Database

## Firebase Configuration Steps

### 1. Enable Authentication
1. Go to Authentication > Sign-in method
2. Enable "Email/Password" provider
3. Enable "Google" provider (add your domain to authorized domains)

### 2. Enable Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (see below)

### 3. Get Configuration Keys
1. Go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click "Web app" icon to create a web app
4. Copy the configuration object

### 4. Environment Variables
Create a `.env` file in the frontend directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

### 5. Firestore Security Rules
Copy the rules from `firestore.rules` file to your Firebase console:

1. Go to Firestore Database > Rules
2. Replace the existing rules with the content from `firestore.rules`
3. Click "Publish"

The rules allow authenticated users to read and write only their own user documents.

### 6. Deploy Firestore Rules (Optional)
You can also deploy rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## User Data Structure

The application creates user profiles in Firestore with the following structure:

```typescript
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Onboarding data
  creatorType?: string;
  referralSource?: string;
  onboardingCompleted: boolean;
  
  // Subscription data
  plan: 'free' | 'pro' | 'business';
  planStartDate: Date;
  
  // Usage tracking
  currentPeriodStart: Date;
  generationsUsed: number;
}
```

## Plan Features

### Free Plan
- 2 generations per month
- 30 min max duration
- No analytics dashboard
- No direct X posting

### Pro Plan ($20/month)
- 30 generations per month
- 60 min max duration
- No analytics dashboard
- Direct X posting enabled

### Business Plan ($49/month)
- 100 generations per month
- 60 min max duration
- Analytics dashboard enabled
- Direct X posting enabled

## Testing the Setup

1. Start the development server: `npm run dev`
2. Navigate to the signup page
3. Create a new account
4. Complete the onboarding flow
5. Verify plan-based features work correctly:
   - Analytics link should only appear for Business plan users
   - Post to X button should only work for Pro/Business plan users

## Troubleshooting

### Quick Fix for Permissions Error

If you get "Missing or insufficient permissions" error:

1. **Update Firestore Rules** in Firebase Console:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write, create: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

2. **Ensure Authentication is Enabled:**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" 
   - Enable "Google" (add localhost:5173 to authorized domains)

3. **Restart Development Server** after updating .env file

### Common Issues
- Environment variables not set correctly
- Firestore security rules too restrictive
- Authentication providers not enabled
- Domain not authorized for Google Sign-In
- Browser blocking popups (for Google Sign-In)

For detailed troubleshooting, see `TROUBLESHOOTING.md`
