import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { UserService } from '../lib/userService';
import { UserProfile } from '../types/user';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        console.log('Loading user profile for UID:', user.uid);
        
        // Add a small delay to ensure user is fully authenticated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          let profile = await UserService.getUserProfile(user.uid);
          console.log('Existing profile found:', !!profile);
          
          // If profile doesn't exist, create it
          if (!profile) {
            console.log('Creating new user profile...');
            profile = await UserService.createUserProfile(user);
            console.log('Profile created successfully');
          }
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Error with user profile operations:', error);
          
          // If it's a permissions error, wait a bit and try again
          if ((error as any).code === 'permission-denied') {
            console.log('Permission denied, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const profile = await UserService.createUserProfile(user);
              setUserProfile(profile);
              console.log('Profile created on retry');
            } catch (retryError) {
              console.error('Retry failed:', retryError);
            }
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email: string, password: string, displayName?: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // User profile will be created automatically in the onAuthStateChanged listener
    // No need to create it here to avoid race conditions
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
    
    // User profile will be handled automatically in the onAuthStateChanged listener
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(displayName: string) {
    if (!currentUser) throw new Error('No user logged in');
    
    await updateProfile(currentUser, { displayName });
    
    if (userProfile) {
      await UserService.updateUserProfile(currentUser.uid, { displayName });
      setUserProfile({ ...userProfile, displayName });
    }
  }

  async function refreshUserProfile() {
    if (currentUser) {
      const profile = await UserService.getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  }

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
