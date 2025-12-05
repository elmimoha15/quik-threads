import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Sparkles, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface EditorProps {
  onNavigate: (page: string) => void;
}

const FORMAT_LABELS = {
  one_liner: { name: 'One-Liner', emoji: '⚡', color: '#3b82f6', description: 'Short, punchy statements (100-150 chars)' },
  hot_take: { name: 'Hot Take', emoji: '🔥', color: '#ef4444', description: 'Bold opinions that spark conversation' },
  paragraph: { name: 'Paragraph', emoji: '📝', color: '#8b5cf6', description: 'Well-structured, complete thoughts' },
  mini_story: { name: 'Mini-Story', emoji: '📖', color: '#10b981', description: 'Narrative-driven short stories' },
  insight: { name: 'Insight', emoji: '💡', color: '#f59e0b', description: 'Value-packed educational content' },
  list_post: { name: 'List Post', emoji: '📋', color: '#06b6d4', description: 'Numbered or bulleted points' }
};

type FormatType = keyof typeof FORMAT_LABELS;

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
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('one_liner');
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadLatestPost();
  }, []);

  const loadLatestPost = () => {
    try {
      // Check if we're loading a specific post from the Posts page
      const selectedPostId = localStorage.getItem('selectedThreadId'); // Still using 'selectedThreadId' key for compatibility
      
      if (selectedPostId) {
        const postsData = localStorage.getItem('threads'); // Still using 'threads' key for compatibility
        if (postsData) {
          const postsList = JSON.parse(postsData);
          const selectedPost = postsList.find((p: any) => p.id === selectedPostId);
          
          if (selectedPost) {
            setCurrentPost(selectedPost);
            localStorage.removeItem('selectedThreadId');
            setLoading(false);
            return;
          }
        }
      }
      
      // Otherwise, load most recent completed job
      const completedJobData = localStorage.getItem('completedJob');
      if (completedJobData) {
        const data = JSON.parse(completedJobData);
        setCurrentPost(data);
      } else {
        // Fall back to most recent post in list
        const postsData = localStorage.getItem('threads');
        if (postsData) {
          const parsedPosts = JSON.parse(postsData);
          if (parsedPosts.length > 0) {
            setCurrentPost(parsedPosts[parsedPosts.length - 1]);
          }
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading posts:', err);
      setLoading(false);
    }
  };

  const handleCopyPost = async (postContent: string, index: number) => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getPostsForFormat = (): string[] => {
    if (!currentPost?.posts) return [];
    return currentPost.posts[selectedFormat] || [];
  };

  const currentFormatData = FORMAT_LABELS[selectedFormat];
  const variations = getPostsForFormat();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar currentPage="editor" onNavigate={onNavigate} />
        <div className="ml-64 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPost || !currentPost.posts) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar currentPage="editor" onNavigate={onNavigate} />
        <div className="ml-64 p-8">
          <div className="max-w-6xl mx-auto text-center py-20">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4 text-foreground">No Posts Yet</h2>
            <p className="text-muted-foreground mb-8">
              Generate your first set of X posts to get started!
            </p>
            <button
              onClick={() => onNavigate('generator')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
            >
              Generate Posts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="editor" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => onNavigate('threads')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to X Posts
            </button>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Generated X Posts</h1>
            {currentPost.source && (
              <p className="text-muted-foreground text-lg">
                Generated from: <span className="font-medium">{currentPost.source}</span>
              </p>
            )}
          </div>

          {/* Format Selector */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Select Post Format</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(FORMAT_LABELS).map(([key, data]) => {
                const formatKey = key as FormatType;
                const isSelected = selectedFormat === formatKey;
                const postsCount = currentPost.posts?.[formatKey]?.length || 0;
                
                return (
                  <motion.button
                    key={key}
                    onClick={() => setSelectedFormat(formatKey)}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-3xl mb-2">{data.emoji}</div>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {data.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {postsCount} {postsCount === 1 ? 'variation' : 'variations'}
                    </div>
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{ 
                          boxShadow: `0 0 0 2px ${data.color}40`,
                        }}
                        layoutId="formatSelector"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Format Description */}
          <div className="mb-6 p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentFormatData.emoji}</div>
              <div>
                <h3 className="font-semibold text-foreground">{currentFormatData.name}</h3>
                <p className="text-sm text-muted-foreground">{currentFormatData.description}</p>
              </div>
            </div>
          </div>

          {/* Post Variations */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFormat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {variations.length > 0 ? (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Post Variations ({variations.length})
                  </h2>
                  <div className="grid gap-4">
                    {variations.map((postContent, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                      >
                        {/* Variation Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                              style={{ backgroundColor: currentFormatData.color }}
                            >
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              Variation {index + 1}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopyPost(postContent, index)}
                            className={`
                              flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                              ${copiedIndex === index
                                ? 'bg-green-500 text-white'
                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                              }
                            `}
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-4 h-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>

                        {/* Post Content */}
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {postContent}
                          </p>
                          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                            <span>{postContent.length} characters</span>
                            <span className={postContent.length <= 280 ? 'text-green-500' : 'text-red-500'}>
                              {postContent.length <= 280 ? '✓ Within X limit' : '⚠ Over X limit'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <p className="text-muted-foreground">
                    No {currentFormatData.name.toLowerCase()} posts available for this generation.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
