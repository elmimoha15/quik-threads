import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Clock, TrendingUp, Loader2, FileText, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/apiService';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { removeDuplicateThreads } from '../utils/threadUtils';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser, usageData } = useAuth();
  const { canAccessAnalytics } = usePlanAccess();
  const [threadsCreated, setThreadsCreated] = useState(0);
  const [totalEngagement, setTotalEngagement] = useState(0);
  const [engagementGrowth, setEngagementGrowth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Remove duplicates first, then load threads count from localStorage
      const cleanedThreads = removeDuplicateThreads();
      const threadsList = cleanedThreads || [];
      
      setThreadsCreated(threadsList.length);
      
      // Get last 5 threads sorted by creation date
      const sortedThreads = threadsList
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
      setRecentThreads(sortedThreads);

      // Load analytics if user has access
      if (canAccessAnalytics()) {
        setAnalyticsLoading(true);
        try {
          const analytics = await apiService.getAnalytics();
          setTotalEngagement(analytics.totalEngagements || 0);
          setEngagementGrowth(analytics.weekOverWeekGrowth || 0);
        } catch (error) {
          console.error('Error loading analytics:', error);
          // Use fallback data if analytics fails
          setTotalEngagement(0);
          setEngagementGrowth(0);
        } finally {
          setAnalyticsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there';
  const creditsUsed = usageData?.creditsUsed || 0;
  const creditsLimit = usageData?.maxCredits || 0;
  const usagePercentage = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleThreadClick = (threadId: string) => {
    localStorage.setItem('selectedThreadId', threadId);
    onNavigate('editor');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                Welcome back, {userName} 👋
              </h1>
              <p className="text-lg" style={{ color: '#6b7280' }}>
                Let's create something amazing today
              </p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => onNavigate('generator')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl text-white"
                style={{ 
                  backgroundColor: '#6b7ba3',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                }}
              >
                <Plus className="w-6 h-6" />
                Generate New Thread
              </motion.button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-2xl bg-white"
              style={{ 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-base" style={{ color: '#6b7280' }}>Threads Created</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                  <Sparkles className="w-6 h-6" style={{ color: '#3b82f6' }} />
                </div>
              </div>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6b7ba3' }} />
              ) : (
                <>
                  <p className="text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>{threadsCreated}</p>
                  <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                    Total threads generated
                  </p>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-white"
              style={{ 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-base" style={{ color: '#6b7280' }}>Total Engagement</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#d1fae5' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#10b981' }} />
                </div>
              </div>
              {analyticsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6b7ba3' }} />
              ) : canAccessAnalytics() ? (
                <>
                  <p className="text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
                    {totalEngagement.toLocaleString()}
                  </p>
                  <p className="text-sm font-medium" style={{ color: engagementGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                    {engagementGrowth >= 0 ? '+' : ''}{engagementGrowth.toFixed(1)}% vs last month
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold mb-2" style={{ color: '#1a1a1a' }}>—</p>
                  <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Upgrade for analytics</p>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-2xl bg-white"
              style={{ 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-base" style={{ color: '#6b7280' }}>Usage This Month</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e9d5ff' }}>
                  <Clock className="w-6 h-6" style={{ color: '#a855f7' }} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                {creditsUsed} / {creditsLimit}
              </p>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e5e7eb' }}>
                <div className="h-2 rounded-full" style={{ 
                  width: `${Math.min(100, usagePercentage)}%`,
                  backgroundColor: '#6b7ba3'
                }} />
              </div>
            </motion.div>
          </div>

          <div className="p-8 rounded-2xl bg-white" style={{ 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
          }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Recent Generations</h2>
              <button 
                onClick={() => onNavigate('threads')}
                className="text-sm font-medium hover:underline" 
                style={{ color: '#6b7ba3' }}
              >
                View All
              </button>
            </div>

            {recentThreads.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#dbeafe' }}>
                  <Sparkles className="w-8 h-8" style={{ color: '#3b82f6' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1a1a1a' }}>No threads yet</h3>
                <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
                  Get started by creating your first X post thread
                </p>
                <button
                  onClick={() => onNavigate('generator')}
                  className="px-6 py-3 rounded-xl font-medium text-white inline-flex items-center gap-2"
                  style={{ backgroundColor: '#6b7ba3' }}
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Thread
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentThreads.map((thread, index) => (
                  <motion.div
                    key={thread.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleThreadClick(thread.id)}
                    className="p-4 rounded-xl transition-all cursor-pointer group"
                    style={{ 
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#6b7ba3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-base" style={{ color: '#1a1a1a' }}>
                            {thread.topic || thread.title || 'Untitled Generation'}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${thread.status === 'processing' ? 'flex items-center gap-1' : ''}`}
                            style={{
                              backgroundColor: thread.status === 'processing'
                                ? 'rgba(107, 123, 163, 0.2)'
                                : thread.status === 'complete' || thread.status === 'published'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                              color: thread.status === 'processing'
                                ? '#6b7ba3'
                                : thread.status === 'complete' || thread.status === 'published'
                                ? '#10b981'
                                : '#f59e0b',
                              border: thread.status === 'processing'
                                ? '1px solid #6b7ba3'
                                : thread.status === 'complete' || thread.status === 'published'
                                ? '1px solid rgba(16, 185, 129, 0.3)'
                                : '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                          >
                            {thread.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {thread.status === 'processing' ? 'Processing' : thread.status === 'complete' ? 'Complete' : thread.status}
                          </span>
                        </div>
                        
                        {/* Preview snippet */}
                        {thread.preview && (
                          <p className="text-sm mb-2 line-clamp-1" style={{ color: '#6b7280' }}>
                            {thread.preview}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm" style={{ color: '#6b7280' }}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(thread.createdAt)}
                          </span>
                          {thread.tweets > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {Array.isArray(thread.tweets) ? thread.tweets.length : thread.tweets} tweets
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight 
                        className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" 
                        style={{ color: '#6b7ba3' }} 
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
