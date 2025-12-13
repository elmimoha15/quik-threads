import { apiService } from '../lib/apiService';
import toast from 'react-hot-toast';
import { firestoreThreadService } from './firestoreThreadService';

interface PollingJob {
  jobId: string;
  topic: string;
  onComplete: (result: any) => void;
  onError: (error: any) => void;
}

class JobPollingService {
  private activeJobs: Map<string, PollingJob> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL = 3000; // 3 seconds

  startPolling(
    jobId: string, 
    topic: string, 
    onComplete: (result: any) => void, 
    onError: (error: any) => void
  ) {
    this.activeJobs.set(jobId, { jobId, topic, onComplete, onError });
    
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(() => this.pollJobs(), this.POLL_INTERVAL);
    }
  }

  stopPolling(jobId: string) {
    this.activeJobs.delete(jobId);
    
    if (this.activeJobs.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async pollJobs() {
    for (const [jobId, job] of this.activeJobs.entries()) {
      try {
        const status = await apiService.getJob(jobId);
        
        // Get user ID from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.warn('No user ID found for job polling');
          continue;
        }
        
        if (status.status === 'completed' && status.posts) {
          // Count total posts across all formats
          const postsData = status.posts as Record<string, string[]>;
          const totalPosts = Object.values(postsData).reduce((sum, posts) => sum + posts.length, 0);
          const firstPost = Object.values(postsData).flat()[0] || 'Posts generated successfully';
          
          // Update thread in Firestore
          try {
            await firestoreThreadService.updateThread(jobId, userId, {
              status: 'completed',
              posts: status.posts,
              tweetCount: totalPosts,
              firstTweet: firstPost.substring(0, 100),
            });
            console.log('✅ Thread updated in Firestore:', jobId);
          } catch (firestoreError) {
            console.error('Failed to update thread in Firestore:', firestoreError);
          }
          
          toast.success(`✅ "${job.topic}" generated successfully!`, {
            duration: 5000,
          });
          job.onComplete(status);
          this.stopPolling(jobId);
        } else if (status.status === 'failed') {
          // Update thread status to failed in Firestore
          try {
            await firestoreThreadService.updateThread(jobId, userId, {
              status: 'failed',
              error: status.error || 'Generation failed',
            });
          } catch (firestoreError) {
            console.error('Failed to update failed thread in Firestore:', firestoreError);
          }
          
          toast.error(`❌ Failed to generate "${job.topic}"`, {
            duration: 5000,
          });
          job.onError(status.error || 'Generation failed');
          this.stopPolling(jobId);
        }
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error);
      }
    }
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  isJobActive(jobId: string): boolean {
    return this.activeJobs.has(jobId);
  }
}

export const jobPollingService = new JobPollingService();
