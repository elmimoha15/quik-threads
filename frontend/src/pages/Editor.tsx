import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/apiService';
import StatusMessages from '../components/editor/StatusMessages';
import ThreadSelector from '../components/editor/ThreadSelector';
import ThreadHeader from '../components/editor/ThreadHeader';
import TweetCard from '../components/editor/TweetCard';
import LegacyPostCard from '../components/editor/LegacyPostCard';

interface EditorProps {
  onNavigate: (page: string) => void;
}

interface XPost {
  id: string;
  content: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
  };
  engagement: {
    likes: number;
    retweets: number;
    replies: number;
  };
  timestamp: string;
}

const xPosts: XPost[] = [
  {
    id: '1',
    content: '🚀 How to grow your audience on X in 2025:\n\n• Post consistently (1-2 times daily)\n• Engage authentically with your community\n• Share valuable insights, not just promotion\n• Use threads for deeper storytelling\n• Reply to comments within the first hour\n\nConsistency beats perfection every time.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 3247, retweets: 892, replies: 341 },
    timestamp: '2h'
  },
  {
    id: '2',
    content: 'The X algorithm in 2025 rewards:\n\n→ Quick engagement (likes/replies in first 30 mins)\n→ Conversations over broadcasts\n→ Original content over reposts\n→ Video content (especially short clips)\n→ Threads that tell complete stories\n\nWork with the algorithm, not against it.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 2156, retweets: 634, replies: 287 },
    timestamp: '2h'
  },
  {
    id: '3',
    content: 'Biggest X growth mistakes I see in 2025:\n\n❌ Posting without engaging\n❌ Only sharing your own content\n❌ Ignoring your comment section\n❌ Posting at random times\n❌ Not having a clear niche\n\nFix these and watch your follower count climb.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 1892, retweets: 445, replies: 198 },
    timestamp: '2h'
  },
  {
    id: '4',
    content: 'Want to know the secret to viral X content?\n\nIt\'s not about having perfect posts.\n\nIt\'s about solving problems people are desperately searching for solutions to.\n\nI found people spending hours creating content manually. One thread about automation got 50K views because it solved a real pain point.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 2734, retweets: 721, replies: 412 },
    timestamp: '2h'
  },
  {
    id: '5',
    content: 'My X growth breakdown after 1 year:\n\n• 50K followers from consistent posting\n• 2M impressions monthly from engagement\n• 500+ leads from valuable content\n• 10+ partnerships from networking\n\nConsistent value = organic growth.\nEngagement = reach.\nNetworking = opportunities.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 4123, retweets: 1234, replies: 567 },
    timestamp: '2h'
  },
  {
    id: '6',
    content: 'If you\'re growing on X in 2025, focus on these 3 things:\n\n1. Provide value before asking for anything\n2. Engage genuinely with your community\n3. Stay consistent with your posting schedule\n\nEverything else is secondary.\n\nThe algorithm rewards authentic engagement, not gaming.',
    author: { name: 'Alex Chen', handle: '@alexbuilds', avatar: 'AC' },
    engagement: { likes: 5678, retweets: 1567, replies: 789 },
    timestamp: '2h'
  }
];

export default function Editor({ onNavigate }: EditorProps) {
  const { canPostToX } = usePlanAccess();
  const { userProfile } = useAuth();
  const [jobData, setJobData] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState(0);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load completed job data
    const completedJobData = localStorage.getItem('completedJob');
    if (!completedJobData) {
      onNavigate('generator');
      return;
    }

    const data = JSON.parse(completedJobData);
    setJobData(data);
    setThreads(data.threads || []);
  }, [onNavigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const postToX = async (threadIndex: number) => {
    if (!canPostToX()) {
      setError('Posting to X is only available for Pro and Business plans. Please upgrade to continue.');
      setTimeout(() => onNavigate('billing'), 2000);
      return;
    }

    if (!jobData?.jobId) {
      setError('No job data found. Please generate content first.');
      return;
    }

    setIsPosting(true);
    setError(null);
    setPostSuccess(null);

    try {
      const response = await apiService.postToTwitter(jobData.jobId, threadIndex);
      
      if (response.success) {
        setPostSuccess(response.threadUrl || 'Thread posted successfully!');
        
        // Show success message for 5 seconds
        setTimeout(() => setPostSuccess(null), 5000);
      } else {
        throw new Error(response.error || 'Failed to post thread');
      }
      
    } catch (error: any) {
      console.error('Error posting to X:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('upgrade')) {
        setError(error.message);
        setTimeout(() => onNavigate('billing'), 2000);
      } else {
        setError(error.message || 'Failed to post to X. Please try again.');
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">Generated X Posts</h1>
            {jobData && (
              <p className="text-muted-foreground text-lg">
                Generated from: <span className="font-medium">{jobData.title}</span>
              </p>
            )}
          </div>

          <StatusMessages postSuccess={postSuccess} error={error} />

          <ThreadSelector 
            threads={threads} 
            selectedThread={selectedThread} 
            setSelectedThread={setSelectedThread} 
          />

          <div className="space-y-6">
            {threads.length > 0 && threads[selectedThread] ? (
              <>
                <ThreadHeader
                  thread={threads[selectedThread]}
                  threadIndex={selectedThread}
                  canPostToX={canPostToX()}
                  isPosting={isPosting}
                  onPostToX={postToX}
                  onNavigate={onNavigate}
                  onCopyAll={copyToClipboard}
                />

                {/* Individual Tweets */}
                <div className="grid md:grid-cols-2 gap-4">
                  {threads[selectedThread].tweets?.map((tweet: any, index: number) => (
                    <TweetCard
                      key={index}
                      tweet={tweet}
                      index={index}
                      userProfile={userProfile}
                      onCopy={copyToClipboard}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No threads available. Please generate content first.</p>
                <button
                  onClick={() => onNavigate('generator')}
                  className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  Generate Content
                </button>
              </div>
            )}
          </div>

          {/* Legacy fallback for old format */}
          {threads.length === 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {xPosts.map((post, index) => (
                <LegacyPostCard
                  key={post.id}
                  post={post}
                  index={index}
                  onCopy={copyToClipboard}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
