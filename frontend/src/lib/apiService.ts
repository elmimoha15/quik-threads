import { auth } from './firebase';

// API Response Types for Auth and Usage
interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

interface UsageResponse {
  currentUsage: number;
  monthlyLimit: number;
  addonCredits: number;
  tier: string;
  resetDate: any;
  features: {
    analytics: boolean;
    postToX: boolean;
  };
}

const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // User Profile Management
  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile');
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Usage and Credits
  async getUsage(): Promise<UsageResponse> {
    return this.request<UsageResponse>('/users/usage');
  }

  // Content Processing
  async uploadFile(file: File, topic?: string, aiInstructions?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (topic) formData.append('topic', topic);
    if (aiInstructions) formData.append('aiInstructions', aiInstructions);

    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async processUrl(url: string, topic?: string, aiInstructions?: string): Promise<any> {
    return this.request('/process', {
      method: 'POST',
      body: JSON.stringify({
        type: 'url',
        contentUrl: url,
        topic,
        aiInstructions,
      }),
    });
  }

  async processTopic(topic: string, aiInstructions?: string): Promise<any> {
    return this.request('/process/topic', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        aiInstructions,
      }),
    });
  }

  // Job Management
  async getJob(jobId: string): Promise<any> {
    return this.request(`/jobs/${jobId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
