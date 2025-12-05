import { apiService } from '../lib/apiService';
import toast from 'react-hot-toast';
import { updateThreadInList, addThreadToList } from '../utils/threadUtils';

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
        
        if (status.status !== 'completed' && status.status !== 'failed') {
          // Update progress for processing posts
          updateThreadInList(jobId, {
            progress: status.progress || 0
          });
        }
        
        if (status.status === 'completed' && status.posts) {
          // Count total posts across all formats
          const postsData = status.posts as Record<string, string[]>;
          const totalPosts = Object.values(postsData).reduce((sum, posts) => sum + posts.length, 0);
          const firstPost = Object.values(postsData)[0]?.[0] || 'Posts generated successfully';
          
          // Update existing thread to complete status
          const wasUpdated = updateThreadInList(jobId, {
            status: 'complete',
            tweets: totalPosts,
            result: status,
            progress: 100,
            preview: firstPost.substring(0, 100)
          });
          
          // Fallback: If thread doesn't exist, create it
          if (!wasUpdated) {
            addThreadToList({
              id: jobId,
              topic: job.topic,
              title: job.topic,
              status: 'complete',
              createdAt: new Date().toISOString(),
              tweets: totalPosts,
              result: status,
              progress: 100,
              preview: firstPost.substring(0, 100)
            });
          }
          
          // Only show toast once
          toast.success(`✅ "${job.topic}" generated successfully!`, {
            duration: 5000,
          });
          job.onComplete(status);
          this.stopPolling(jobId);
        } else if (status.status === 'failed') {
          // Update thread status to failed
          updateThreadInList(jobId, {
            status: 'failed',
            progress: 0
          });
          
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
