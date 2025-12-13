import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { firestoreThreadService } from '../services/firestoreThreadService';
import { useAuth } from '../contexts/AuthContext';
import FormatSelector, { FormatType } from '../components/editor/FormatSelector';
import FormatDescription from '../components/editor/FormatDescription';
import PostVariations from '../components/editor/PostVariations';
import EditorHeader from '../components/editor/EditorHeader';
import { LoadingState, EmptyState } from '../components/editor/EditorStates';

interface EditorProps {
  onNavigate: (page: string) => void;
}

interface Post {
  id: string;
  posts?: {
    [key in FormatType]?: string[];
  };
  source?: string;
  timestamp?: string;
  jobId?: string;
}

export default function Editor({ onNavigate }: EditorProps) {
  const { currentUser } = useAuth();
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('one_liner');
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestPost();
  }, [currentUser]);

  const loadLatestPost = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const selectedThreadId = localStorage.getItem('selectedThreadId');
      
      if (selectedThreadId) {
        const thread = await firestoreThreadService.getThread(selectedThreadId, currentUser.uid);
        
        if (thread && thread.status === 'completed') {
          setCurrentPost({
            id: thread.id,
            posts: thread.posts,
            source: thread.contentSource,
            timestamp: thread.createdAt,
            jobId: thread.id
          });
          localStorage.removeItem('selectedThreadId');
          setLoading(false);
          return;
        }
      }
      
      const completedJobData = localStorage.getItem('completedJob');
      if (completedJobData) {
        const data = JSON.parse(completedJobData);
        setCurrentPost(data);
      } else {
        const threads = await firestoreThreadService.getUserThreads(currentUser.uid);
        const completedThreads = threads.filter(t => t.status === 'completed');
        if (completedThreads.length > 0) {
          const latestThread = completedThreads[0];
          setCurrentPost({
            id: latestThread.id,
            posts: latestThread.posts,
            source: latestThread.contentSource,
            timestamp: latestThread.createdAt,
            jobId: latestThread.id
          });
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading posts:', err);
      setLoading(false);
    }
  };

  const getPostsForFormat = (): string[] => {
    if (!currentPost?.posts) return [];
    return currentPost.posts[selectedFormat] || [];
  };

  const getPostCounts = () => {
    const counts: Record<FormatType, number> = {
      one_liner: 0,
      hot_take: 0,
      paragraph: 0,
      mini_story: 0,
      insight: 0,
      list_post: 0
    };

    if (currentPost?.posts) {
      Object.keys(counts).forEach((key) => {
        const formatKey = key as FormatType;
        counts[formatKey] = currentPost.posts?.[formatKey]?.length || 0;
      });
    }

    return counts;
  };

  if (loading) {
    return <LoadingState onNavigate={onNavigate} />;
  }

  if (!currentPost || !currentPost.posts) {
    return <EmptyState onNavigate={onNavigate} />;
  }

  const variations = getPostsForFormat();
  const postCounts = getPostCounts();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <Sidebar currentPage="editor" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <EditorHeader source={currentPost.source} onNavigate={onNavigate} />
          
          <FormatSelector
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
            postCounts={postCounts}
          />

          <FormatDescription selectedFormat={selectedFormat} />

          <PostVariations
            variations={variations}
            selectedFormat={selectedFormat}
            jobId={currentPost.id}
          />
        </div>
      </div>
    </div>
  );
}
