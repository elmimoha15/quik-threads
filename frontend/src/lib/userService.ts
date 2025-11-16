import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { UserProfile, PLANS } from '../types/user';

export class UserService {
  static async createUserProfile(user: User, additionalData: Partial<UserProfile> = {}): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', user.uid);
      
      const now = new Date();
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        createdAt: now,
        updatedAt: now,
        onboardingCompleted: false,
        plan: 'free',
        planStartDate: now,
        currentPeriodStart: now,
        generationsUsed: 0,
        ...additionalData
      };

      await setDoc(userRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        planStartDate: serverTimestamp(),
        currentPeriodStart: serverTimestamp()
      });

      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          planStartDate: data.planStartDate?.toDate() || new Date(),
          currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  static async completeOnboarding(
    uid: string, 
    onboardingData: {
      creatorType: string;
      planType: 'free' | 'pro' | 'business';
      referralSource: string;
    }
  ): Promise<void> {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      creatorType: onboardingData.creatorType,
      plan: onboardingData.planType,
      referralSource: onboardingData.referralSource,
      onboardingCompleted: true,
      planStartDate: serverTimestamp(),
      currentPeriodStart: serverTimestamp(),
      generationsUsed: 0,
      updatedAt: serverTimestamp()
    });
  }

  static async updateUserPlan(uid: string, newPlan: 'free' | 'pro' | 'business'): Promise<void> {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      plan: newPlan,
      planStartDate: serverTimestamp(),
      currentPeriodStart: serverTimestamp(),
      generationsUsed: 0,
      updatedAt: serverTimestamp()
    });
  }

  static getUserPlanFeatures(planId: 'free' | 'pro' | 'business') {
    return PLANS[planId]?.features || PLANS.free.features;
  }

  static canAccessAnalytics(planId: 'free' | 'pro' | 'business'): boolean {
    return this.getUserPlanFeatures(planId).hasAnalytics;
  }

  static canPostToX(planId: 'free' | 'pro' | 'business'): boolean {
    return this.getUserPlanFeatures(planId).hasPostToX;
  }

  static canGenerate(profile: UserProfile): boolean {
    const planFeatures = this.getUserPlanFeatures(profile.plan);
    return profile.generationsUsed < planFeatures.generationsPerMonth;
  }
}
