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
  creditsUsed: number;
  maxCredits: number;
  remaining: number;
  tier: string;
  resetDate: string;
}

// API Base URL - will be configured for Python FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error ${response.status}:`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
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
    return this.request<UsageResponse>('/users/quota');
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

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return response.json();
  }

  // Test endpoint for connectivity
  async testConnection(): Promise<any> {
    return this.request('/test');
  }

  // Twitter/X Posting
  async postToTwitter(jobId: string, threadIndex: number): Promise<any> {
    return this.request('/twitter/post', {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        threadIndex,
      }),
    });
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    return this.request('/analytics');
  }

  async clearAnalyticsCache(): Promise<any> {
    return this.request('/analytics/cache', {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
