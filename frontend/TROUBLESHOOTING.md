# Firebase Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. "Missing or insufficient permissions" Error

This error occurs when Firestore security rules are not properly configured or when there's a timing issue with authentication.

**Solution Steps:**

1. **Check Firebase Console Setup:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Ensure "Email/Password" is enabled
   - Ensure "Google" is enabled (if using Google Sign-In)
   - Add your domain (localhost:5173 for dev) to authorized domains

2. **Update Firestore Security Rules:**
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

3. **Check Environment Variables:**
   Ensure your `.env` file has all required Firebase config values:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Restart Development Server:**
   After updating `.env`, restart with `npm run dev`

### 2. Google Sign-In Issues

**Common Problems:**
- Popup blocked by browser
- Domain not authorized
- OAuth configuration missing

**Solutions:**
1. **Check Browser Console** for specific error messages
2. **Add Authorized Domains** in Firebase Console:
   - Go to Authentication → Settings → Authorized domains
   - Add `localhost` and your production domain
3. **Configure OAuth Consent Screen** in Google Cloud Console
4. **Test in Incognito Mode** to avoid cached auth states

### 3. User Profile Not Created

If users can sign up but profiles aren't created in Firestore:

1. **Check Firestore Rules** (see above)
2. **Verify Network Tab** in browser dev tools for failed requests
3. **Check Firebase Console** → Firestore → Data for user documents
4. **Review Console Logs** for detailed error messages

### 4. Development vs Production Issues

**Development Setup:**
- Use localhost domains
- Check CORS settings
- Ensure emulators are not conflicting

**Production Setup:**
- Update authorized domains
- Use production Firebase project
- Check production environment variables

## Debug Steps

1. **Open Browser Developer Tools**
2. **Check Console Tab** for error messages
3. **Check Network Tab** for failed API calls
4. **Verify Authentication State** in Application → Local Storage

## Testing Checklist

- [ ] Firebase project created and configured
- [ ] Authentication providers enabled
- [ ] Firestore database created
- [ ] Security rules updated and published
- [ ] Environment variables set correctly
- [ ] Development server restarted
- [ ] Browser cache cleared
- [ ] Console shows successful authentication
- [ ] User document created in Firestore
- [ ] Onboarding flow completes successfully

## Contact Information

If issues persist:
1. Check Firebase Console for service status
2. Review Firebase documentation
3. Test with a fresh Firebase project
4. Verify billing is enabled (if using production features)
