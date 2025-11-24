import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Clock, TrendingUp, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../lib/apiService';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser, userProfile } = useAuth();
  const [quotaData, setQuotaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuotaData();
  }, []);

  const loadQuotaData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsage();
      setQuotaData(data);
    } catch (err: any) {
      console.error('Failed to load quota:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there';
  const creditsUsed = quotaData?.creditsUsed || 0;
  const creditsLimit = quotaData?.maxCredits || 0;
  const creditsRemaining = quotaData?.remaining || Math.max(0, creditsLimit - creditsUsed);
  const usagePercentage = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;

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
                  <p className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{creditsUsed}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {creditsRemaining} remaining
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
              <p className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {creditsUsed} / {creditsLimit}
              </p>
              <div className="w-full rounded-full h-3 bg-slate-100">
                <div className="h-3 rounded-full" style={{ 
                  width: `${Math.min(100, usagePercentage)}%`,
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
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <motion.button
                onClick={() => onNavigate('generator')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 rounded-xl text-left transition-all border border-slate-200 hover:border-blue-300 bg-white hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary-100)' }}>
                  <Plus className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Generate New Thread</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Upload audio/video or paste a URL to create engaging X posts
                </p>
              </motion.button>

              <motion.button
                onClick={() => onNavigate('threads')}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="p-6 rounded-xl text-left transition-all border border-slate-200 hover:border-blue-300 bg-white hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--success-light)' }}>
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--success)' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>View All Threads</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Browse and manage your generated X post threads
                </p>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
