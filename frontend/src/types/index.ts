export interface Thread {
  id: string;
  title: string;
  content: string[];
  createdAt: string;
  type: string;
  engagement?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'creator';
  threadsUsed: number;
  threadsLimit: number;
}

export interface OnboardingStep {
  step: number;
  contentType?: string;
  uploadUrl?: string;
  tone?: string;
}
