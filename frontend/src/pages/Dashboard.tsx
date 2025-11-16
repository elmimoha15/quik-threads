import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Clock, TrendingUp, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { UserUsageStats } from '../types/user.types';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const recentPosts = [
  {
    id: '1',
    title: 'AI in 2024: What You Need to Know',
    tweets: 8,
    createdAt: '2 hours ago',
    engagement: 2450,
  },
  {
    id: '2',
    title: 'Building a Successful Podcast',
    tweets: 12,
    createdAt: '1 day ago',
    engagement: 1820,
  },
  {
    id: '3',
    title: 'Content Creation Tips for Beginners',
    tweets: 6,
    createdAt: '3 days ago',
    engagement: 3100,
  },
];

export default function Dashboard({ onNavigate }: DashboardProps) {
  // Mock user for display
  const currentUser = { displayName: 'John Doe', email: 'john@example.com' };
  const [usage, setUsage] = useState<UserUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      // Mock usage data
      const mockUsage: UserUsageStats = {
        threads_created: 12,
        remaining: 18,
        usage_limit: 30
      };
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setUsage(mockUsage);
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar currentPage="dashboard" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Welcome back, {userName} 👋
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                Let's create something amazing today
              </p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => onNavigate('generator')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center gap-3 px-8 py-4 text-lg font-semibold"
                style={{ 
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)'
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
              className="bg-white p-8 rounded-2xl border border-slate-100"
              style={{ 
                boxShadow: 'var(--card-shadow)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>X Posts Created</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-100)' }}>
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
              ) : (
                <>
                  <p className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{usage?.threads_created || 0}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {usage?.remaining === -1 ? 'Unlimited' : `${usage?.remaining || 0} remaining`}
                  </p>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl border border-slate-100"
              style={{ 
                boxShadow: 'var(--card-shadow)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>Total Engagement</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--success-light)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>7,370</p>
              <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>+15% vs last month</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-2xl border border-slate-100"
              style={{ 
                boxShadow: 'var(--card-shadow)',
                borderColor: 'var(--card-border)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-secondary)' }}>Usage This Month</h3>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--primary-100)' }}>
                  <Clock className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              <p className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>5 / 30</p>
              <div className="w-full rounded-full h-3 bg-slate-100">
                <div className="h-3 rounded-full" style={{ 
                  width: '16.67%',
                  background: 'var(--gradient-primary)'
                }} />
              </div>
            </motion.div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100" style={{ 
            boxShadow: 'var(--card-shadow)',
            borderColor: 'var(--card-border)'
          }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Recent X Posts</h2>
              <button
                onClick={() => onNavigate('threads')}
                className="font-semibold hover:underline transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-6 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
                  style={{
                    backgroundColor: 'var(--background-secondary)'
                  }}
                  whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
                  onClick={() => onNavigate('editor')}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
                    <div className="flex items-center gap-6 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                      <span>{post.tweets} posts</span>
                      <span>•</span>
                      <span>{post.createdAt}</span>
                      <span>•</span>
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {post.engagement.toLocaleString()} engagement
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl" style={{ color: 'var(--text-muted)' }}>→</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
