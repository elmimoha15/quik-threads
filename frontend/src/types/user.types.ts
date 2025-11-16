export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  twitter_connected: boolean;
  threads_created: number;
  monthly_limit: number;
  tone_preference?: string;
  created_at: any;
  updated_at: any;
}

export interface UserUsageStats {
  threads_created: number;
  remaining: number;
  usage_limit: number;
}
