import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, TrendingUp, MoreVertical, Loader2, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface ThreadsProps {
  onNavigate: (page: string) => void;
}

const defaultThreads: any[] = [
  {
    id: '1',
    title: 'AI in 2024: What You Need to Know',
    topic: 'AI in 2024: What You Need to Know',
    tweets: 8,
    createdAt: '2 hours ago',
    engagement: 2450,
    status: 'published',
    contentTypes: ['thread'],
    contentLength: 'medium',
    threadType: 'educational',
  },
  {
    id: '2',
    title: 'Building a Successful Podcast',
    topic: 'Building a Successful Podcast',
    tweets: 12,
    createdAt: '1 day ago',
    engagement: 1820,
    status: 'published',
    contentTypes: ['post', 'thread'],
    contentLength: 'long',
    threadType: 'tips',
  },
  {
    id: '3',
    title: 'Content Creation Tips for Beginners',
    topic: 'Content Creation Tips for Beginners',
    tweets: 6,
    createdAt: '3 days ago',
    engagement: 3100,
    status: 'published',
    contentTypes: ['thread'],
    contentLength: 'short',
    threadType: 'tips',
  },
  {
    id: '4',
    title: 'The Future of Social Media Marketing',
    topic: 'The Future of Social Media Marketing',
    tweets: 10,
    createdAt: '5 days ago',
    engagement: 1650,
    status: 'draft',
    contentTypes: ['post'],
    contentLength: 'medium',
    threadType: 'promotional',
  },
  {
    id: '5',
    title: 'How to Grow Your YouTube Channel',
    topic: 'How to Grow Your YouTube Channel',
    tweets: 9,
    createdAt: '1 week ago',
    engagement: 2890,
    status: 'published',
    contentTypes: ['thread'],
    contentLength: 'medium',
    threadType: 'story',
  },
];

export default function Threads({ onNavigate }: ThreadsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [allThreads, setAllThreads] = useState(defaultThreads);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [processingThread, setProcessingThread] = useState<any>(null);

  useEffect(() => {
    // Load threads from localStorage
    const threadsData = localStorage.getItem('threads');
    if (threadsData) {
      const savedThreads = JSON.parse(threadsData);
      // Filter out duplicates by ID and merge with defaults
      const savedThreadIds = new Set(savedThreads.map((t: any) => t.id));
      const uniqueDefaults = defaultThreads.filter(t => !savedThreadIds.has(t.id));
      setAllThreads([...savedThreads, ...uniqueDefaults]);
    }

    // Check for active generation
    const generationData = localStorage.getItem('currentGeneration');
    if (generationData) {
      const generation = JSON.parse(generationData);
      if (generation.status === 'processing') {
        setProcessingThread(generation);
      }
    }

    // Poll for updates every second
    const interval = setInterval(() => {
      const generationData = localStorage.getItem('currentGeneration');
      if (generationData) {
        const generation = JSON.parse(generationData);
        if (generation.status === 'processing') {
          setProcessingThread(generation);
        } else {
          setProcessingThread(null);
          // Reload threads
          const threadsData = localStorage.getItem('threads');
          if (threadsData) {
            const savedThreads = JSON.parse(threadsData);
            // Filter out duplicates by ID and merge with defaults
            const savedThreadIds = new Set(savedThreads.map((t: any) => t.id));
            const uniqueDefaults = defaultThreads.filter(t => !savedThreadIds.has(t.id));
            setAllThreads([...savedThreads, ...uniqueDefaults]);
          }
        }
      } else {
        setProcessingThread(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredThreads = allThreads.filter(thread => {
    if (!thread || !thread.title) return false;
    const matchesSearch = thread.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || thread.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteThread = (threadId: string) => {
    setAllThreads(prev => prev.filter(thread => thread.id !== threadId));
    
    // Also remove from localStorage if it exists there
    const threadsData = localStorage.getItem('threads');
    if (threadsData) {
      const savedThreads = JSON.parse(threadsData);
      const updatedThreads = savedThreads.filter((thread: any) => thread.id !== threadId);
      localStorage.setItem('threads', JSON.stringify(updatedThreads));
    }
    
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="threads" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">All X Posts</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-foreground placeholder-muted-foreground"
                placeholder="Search threads..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-foreground"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {processingThread && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border-2 border-primary rounded-xl p-6 cursor-pointer shadow-sm hover:shadow-md transition-all"
                onClick={() => onNavigate('processing')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{processingThread.title}</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{processingThread.currentStep}</span>
                      <span>•</span>
                      <span>{Math.round(processingThread.progress)}% complete</span>
                    </div>
                    <div className="mt-3 w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${processingThread.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {filteredThreads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer shadow-sm"
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button')) {
                    onNavigate('editor');
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">
                        {thread.topic || thread.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          thread.status === 'published'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {thread.createdAt}
                      </span>
                      {thread.contentTypes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {thread.contentTypes.includes('post') && thread.contentTypes.includes('thread') 
                              ? 'Post + Thread' 
                              : thread.contentTypes.includes('post') 
                              ? 'X Post' 
                              : 'Thread'}
                          </span>
                        </>
                      )}
                      {thread.contentLength && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{thread.contentLength}</span>
                        </>
                      )}
                      {thread.threadType && (
                        <>
                          <span>•</span>
                          <span>{thread.threadType === 'tips' ? 'Quick Tips' : thread.threadType === 'story' ? 'Storytelling' : thread.threadType === 'educational' ? 'Educational' : 'Promotional'}</span>
                        </>
                      )}
                      {thread.tweets && (
                        <>
                          <span>•</span>
                          <span>{thread.tweets} tweets</span>
                        </>
                      )}
                      {thread.engagement && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {thread.engagement.toLocaleString()} engagement
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(thread.id);
                      }}
                      className="p-2 rounded-lg transition hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg transition hover:bg-muted">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md mx-4 shadow-xl"
          >
            <h3 className="text-xl font-bold mb-3 text-foreground">Delete X Post</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this X post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteThread(showDeleteConfirm)}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
