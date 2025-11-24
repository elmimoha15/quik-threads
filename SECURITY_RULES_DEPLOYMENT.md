# Firebase Security Rules Deployment Guide

This guide explains how to deploy Firestore and Storage security rules for the QuikThread application.

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in project (if not already done):
   ```bash
   firebase init
   ```
   - Select Firestore and Storage
   - Use existing project
   - Accept default file names (firestore.rules and storage.rules)

## Security Rules Overview

### Firestore Rules (`firestore.rules`)

**User Data Protection:**
- `/users/{userId}`: Users can only read/write their own profile
- `/jobs/{jobId}`: Users can only read their own jobs
- `/posts/{postId}`: Users can only read their own posts
- `/analytics-cache/{userId}`: Users can only read their own analytics

**Backend-Only Collections:**
- `/error-logs`: Denied to all clients (backend service account only)
- `/event-logs`: Denied to all clients (backend service account only)
- `/webhook-logs`: Denied to all clients (backend service account only)

**Default:** All other paths are denied by default

### Storage Rules (`storage.rules`)

**User Uploads:**
- `/users/{userId}/uploads/{filename}`: Users can read/write their own uploads

**Fetched Files:**
- `/users/{userId}/fetched/{filename}`: Users can read, but only backend can write

**Default:** All other paths are denied

## Deployment Commands

### Deploy Firestore Rules Only
```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules Only
```bash
firebase deploy --only storage
```

### Deploy Both Rules
```bash
firebase deploy --only firestore:rules,storage
```

### Deploy Everything (Rules + Functions if any)
```bash
firebase deploy
```

## Testing Security Rules

### Test Firestore Rules

1. **Test User Access (Should Succeed):**
   - User tries to read their own profile: `/users/{their_uid}`
   - User tries to read their own jobs: `/jobs` where userId == their_uid

2. **Test Unauthorized Access (Should Fail):**
   - User tries to read another user's profile: `/users/{other_uid}`
   - User tries to write to `/error-logs`
   - User tries to access `/webhook-logs`

3. **Using Firebase Console:**
   - Go to Firestore → Rules → Rules Playground
   - Test different scenarios with different user IDs

### Test Storage Rules

1. **Test User Upload Access (Should Succeed):**
   - User uploads file to `/users/{their_uid}/uploads/test.mp3`
   - User reads file from `/users/{their_uid}/uploads/test.mp3`

2. **Test Unauthorized Access (Should Fail):**
   - User tries to read `/users/{other_uid}/uploads/test.mp3`
   - User tries to write to `/users/{their_uid}/fetched/test.mp3`

3. **Using Firebase Console:**
   - Go to Storage → Rules → Rules Playground
   - Test different file paths with different user IDs

## Testing from Frontend

### Test Firestore Access

```javascript
// This should work - user accessing their own data
const userDoc = await db.collection('users').doc(currentUser.uid).get();

// This should fail - user accessing another user's data
const otherUserDoc = await db.collection('users').doc('other_user_id').get();
// Error: Missing or insufficient permissions

// This should fail - user trying to write to error-logs
await db.collection('error-logs').add({ message: 'test' });
// Error: Missing or insufficient permissions
```

### Test Storage Access

```javascript
// This should work - user uploading to their own folder
const uploadRef = storage.ref(`users/${currentUser.uid}/uploads/test.mp3`);
await uploadRef.put(file);

// This should fail - user accessing another user's files
const otherRef = storage.ref(`users/other_user_id/uploads/test.mp3`);
await otherRef.getDownloadURL();
// Error: User does not have permission
```

## Monitoring & Debugging

### View Rule Violations

1. **Firestore:**
   - Firebase Console → Firestore → Usage tab
   - Check for denied requests

2. **Storage:**
   - Firebase Console → Storage → Usage tab
   - Check for denied requests

### Enable Debug Mode

Add to your rules for debugging (remove in production):

```javascript
// Firestore
match /users/{userId} {
  allow read, write: if isOwner(userId);
  // Debug: log the auth state
  allow read: if debug(request.auth);
}
```

### Common Issues

1. **Rules not updating:**
   - Wait a few minutes for rules to propagate
   - Clear browser cache
   - Re-deploy rules

2. **Service account access:**
   - Backend service account bypasses security rules
   - Only client SDK requests are subject to rules

3. **Testing locally:**
   - Use Firebase Emulator Suite for local testing
   - `firebase emulators:start`

## Production Checklist

- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage`
- [ ] Test user can access their own data
- [ ] Test user cannot access other users' data
- [ ] Test user cannot write to backend-only collections
- [ ] Monitor rule violations in Firebase Console
- [ ] Set up alerts for unusual access patterns

## Security Best Practices

1. **Never trust client input** - Always validate on backend
2. **Use service account** for backend operations
3. **Monitor access patterns** regularly
4. **Keep rules simple** - Complex rules are harder to audit
5. **Test thoroughly** before deploying to production
6. **Use emulators** for local development
7. **Version control** your rules files

## Emergency Rollback

If you need to rollback rules:

```bash
# View deployment history
firebase deploy:history

# Rollback to previous version
firebase rollback firestore:rules
firebase rollback storage
```

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Security Rules Testing](https://firebase.google.com/docs/rules/unit-tests)
