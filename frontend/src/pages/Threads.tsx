import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, TrendingUp, Loader2, Trash2, FileText } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { removeDuplicateThreads } from '../utils/threadUtils';

interface ThreadsProps {
  onNavigate: (page: string) => void;
}

export default function Threads({ onNavigate }: ThreadsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [allThreads, setAllThreads] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Load threads from localStorage
    const loadThreads = () => {
      // First, remove any duplicates
      const cleanedThreads = removeDuplicateThreads();
      
      if (cleanedThreads) {
        setAllThreads(cleanedThreads);
      } else {
        const threadsData = localStorage.getItem('threads');
        if (threadsData) {
          const savedThreads = JSON.parse(threadsData);
          setAllThreads(savedThreads);
        }
      }
    };

    loadThreads();

    // Poll for updates every second to catch processing status changes
    const interval = setInterval(loadThreads, 1000);

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
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Sidebar currentPage="threads" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#1a1a1a' }}>All X Posts</h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#6b7280' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 outline-none transition"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  color: '#1a1a1a'
                }}
                placeholder="Search threads..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" style={{ color: '#6b7280' }} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 rounded-xl focus:ring-2 outline-none transition"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  color: '#1a1a1a'
                }}
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredThreads.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 px-6 rounded-xl"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb'
                }}
              >
                <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: '#9ca3af' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>No X Posts Yet</h3>
                <p className="mb-6" style={{ color: '#6b7280' }}>
                  Start creating engaging X posts by generating your first thread
                </p>
                <button
                  onClick={() => onNavigate('generator')}
                  className="px-6 py-3 rounded-xl font-medium transition text-white"
                  style={{
                    backgroundColor: '#6b7ba3',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                  }}
                >
                  Create Your First Thread
                </button>
              </motion.div>
            )}
            
            {filteredThreads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl p-6 transition-all cursor-pointer"
                style={{
                  backgroundColor: '#ffffff',
                  border: thread.status === 'processing' ? '2px solid #6b7ba3' : '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (thread.status !== 'processing') {
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(107, 123, 163, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (thread.status !== 'processing') {
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('button')) {
                    if (thread.status === 'processing') {
                      onNavigate('processing');
                    } else {
                      localStorage.setItem('selectedThreadId', thread.id);
                      onNavigate('editor');
                    }
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                        {thread.topic || thread.title || 'Untitled Generation'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${thread.status === 'processing' ? 'flex items-center gap-1' : ''}`}
                        style={{
                          backgroundColor: thread.status === 'processing'
                            ? 'rgba(107, 123, 163, 0.2)'
                            : thread.status === 'complete' || thread.status === 'published'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : thread.status === 'failed'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(245, 158, 11, 0.1)',
                          color: thread.status === 'processing'
                            ? '#6b7ba3'
                            : thread.status === 'complete' || thread.status === 'published'
                            ? '#10b981'
                            : thread.status === 'failed'
                            ? '#ef4444'
                            : '#f59e0b',
                          border: thread.status === 'processing'
                            ? '1px solid #6b7ba3'
                            : thread.status === 'complete' || thread.status === 'published'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : thread.status === 'failed'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        {thread.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                        {thread.status === 'processing' ? 'Processing' : thread.status === 'complete' ? 'Complete' : thread.status}
                      </span>
                    </div>
                    
                    {/* Preview snippet */}
                    {thread.preview && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: '#6b7280' }}>
                        {thread.preview}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm" style={{ color: '#6b7280' }}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        {thread.createdAt || 'Just now'}
                      </span>
                      {thread.status === 'processing' && thread.progress !== undefined && (
                        <>
                          <span>•</span>
                          <span>{Math.round(thread.progress)}% complete</span>
                        </>
                      )}
                      {thread.tweets > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" style={{ color: '#a855f7' }} />
                            {Array.isArray(thread.tweets) ? thread.tweets.length : thread.tweets} tweets
                          </span>
                        </>
                      )}
                      {thread.hook && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} />
                            {thread.hook}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {thread.status !== 'processing' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(thread.id);
                        }}
                        className="p-2 rounded-lg transition"
                        style={{ color: '#9ca3af' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9ca3af';
                        }}
                        title="Delete generation"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 max-w-md mx-4"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
          >
            <h3 className="text-xl font-bold mb-3" style={{ color: '#1a1a1a' }}>Delete X Post</h3>
            <p className="mb-6" style={{ color: '#6b7280' }}>
              Are you sure you want to delete this X post? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg transition"
                style={{
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  color: '#1a1a1a'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteThread(showDeleteConfirm)}
                className="px-4 py-2 rounded-lg transition text-white"
                style={{ backgroundColor: '#dc2626' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
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
