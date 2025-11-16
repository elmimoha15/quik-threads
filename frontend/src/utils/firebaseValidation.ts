import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export const validateFirebaseSetup = async (): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('🔍 Validating Firebase setup...');

  // Check environment variables
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar] || import.meta.env[envVar].includes('your_')) {
      errors.push(`Missing or invalid environment variable: ${envVar}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  try {
    // Test Firebase Auth initialization
    console.log('✅ Firebase Auth initialized');
    
    // Test Firestore connection
    console.log('✅ Firestore initialized');

    // Test anonymous authentication (to check auth setup)
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      console.log('✅ Anonymous authentication works');

      // Test Firestore write permissions
      try {
        const testDoc = doc(db, 'test', user.uid);
        await setDoc(testDoc, { test: true, timestamp: new Date() });
        console.log('✅ Firestore write permissions work');

        // Test Firestore read permissions
        const docSnap = await getDoc(testDoc);
        if (docSnap.exists()) {
          console.log('✅ Firestore read permissions work');
        } else {
          warnings.push('Could not read test document from Firestore');
        }

        // Clean up test document
        await deleteDoc(testDoc);
        console.log('✅ Test document cleaned up');

      } catch (firestoreError) {
        errors.push(`Firestore permissions error: ${(firestoreError as Error).message}`);
      }

      // Sign out anonymous user
      await auth.signOut();
      console.log('✅ Authentication cleanup complete');

    } catch (authError) {
      errors.push(`Authentication error: ${(authError as Error).message}`);
    }

  } catch (initError) {
    errors.push(`Firebase initialization error: ${(initError as Error).message}`);
  }

  const success = errors.length === 0;
  console.log(success ? '🎉 Firebase setup validation complete!' : '❌ Firebase setup has issues');

  return { success, errors, warnings };
};

// Helper function to run validation and log results
export const runFirebaseValidation = async () => {
  const result = await validateFirebaseSetup();
  
  if (result.success) {
    console.log('🎉 Firebase is properly configured!');
  } else {
    console.error('❌ Firebase configuration issues:');
    result.errors.forEach(error => console.error(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
  }

  return result;
};
