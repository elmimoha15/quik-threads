export interface UserPlan {
  id: 'free' | 'pro' | 'business';
  name: string;
  price: number;
  features: {
    generationsPerMonth: number;
    maxDurationMinutes: number;
    hasAnalytics: boolean;
    hasPostToX: boolean;
  };
}

export interface UserProfile {
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
  
  // Subscription data (old format - keeping for backwards compatibility)
  plan?: UserPlan['id'];
  planStartDate?: Date;
  
  // New backend format (from Firestore)
  tier?: 'free' | 'pro' | 'business';
  maxCredits?: number;
  currentCredits?: number;
  maxDuration?: number;
  features?: {
    postToX?: boolean;
    analytics?: boolean;
  };
  
  // Usage tracking
  currentPeriodStart?: Date;
  generationsUsed?: number;
}

export const PLANS: Record<UserPlan['id'], UserPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      generationsPerMonth: 2,
      maxDurationMinutes: 30,
      hasAnalytics: false,
      hasPostToX: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 20,
    features: {
      generationsPerMonth: 30,
      maxDurationMinutes: 60,
      hasAnalytics: false,
      hasPostToX: true,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49,
    features: {
      generationsPerMonth: 100,
      maxDurationMinutes: 60,
      hasAnalytics: true,
      hasPostToX: true,
    },
  },
};
