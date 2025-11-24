import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Heart, MessageCircle, Lock, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { usePlanAccess } from '../hooks/usePlanAccess';
import { apiService } from '../lib/apiService';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
}

export default function Analytics({ onNavigate }: AnalyticsProps) {
  const { canAccessAnalytics } = usePlanAccess();
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Check access first
      if (!canAccessAnalytics()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getAnalytics();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [canAccessAnalytics]);

  // If user doesn't have access, show upgrade prompt
  if (!canAccessAnalytics()) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar currentPage="analytics" onNavigate={onNavigate} />
        
        <div className="ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-12 text-center shadow-sm"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4 text-foreground">Analytics Dashboard</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Unlock powerful insights into your X post performance
              </p>
              
              <div className="bg-muted/50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Business Plan Features:</h3>
                <ul className="text-left space-y-2 text-muted-foreground max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Track impressions, reach, and engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    See week-over-week growth trends
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Identify your top-performing posts
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Analyze engagement patterns
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => onNavigate('billing')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-medium transition"
              >
                Upgrade to Business Plan
              </button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Starting at $49/month
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="analytics" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Analytics</h1>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Analytics Data */}
          {!loading && !error && analyticsData && (
            <>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-muted-foreground">Total Impressions</h3>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analyticsData.totalImpressions?.toLocaleString() || '0'}</p>
              <p className="text-sm text-green-600 mt-2">
                {analyticsData.weekOverWeekGrowth > 0 ? '+' : ''}{analyticsData.weekOverWeekGrowth}% vs last week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-muted-foreground">Total Reach</h3>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analyticsData.totalReach?.toLocaleString() || '0'}</p>
              <p className="text-sm text-green-600 mt-2">
                {analyticsData.weekOverWeekGrowth > 0 ? '+' : ''}{analyticsData.weekOverWeekGrowth}% vs last week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-muted-foreground">Total Likes</h3>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analyticsData.totalLikes?.toLocaleString() || '0'}</p>
              <p className="text-sm text-green-600 mt-2">
                {analyticsData.weekOverWeekGrowth > 0 ? '+' : ''}{analyticsData.weekOverWeekGrowth}% vs last week
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-muted-foreground">Total Engagements</h3>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{analyticsData.totalEngagements?.toLocaleString() || '0'}</p>
              <p className="text-sm text-green-600 mt-2">
                {analyticsData.weekOverWeekGrowth > 0 ? '+' : ''}{analyticsData.weekOverWeekGrowth}% vs last week
              </p>
            </motion.div>
          </div>

          {/* Top Posts */}
          {analyticsData.topPosts && analyticsData.topPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-2xl font-bold mb-6 text-foreground">Top Performing Posts</h2>
              <div className="space-y-4">
                {analyticsData.topPosts.map((post: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl transition bg-muted/50 hover:bg-muted border border-border"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{post.title || `Post ${index + 1}`}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {post.retweets || 0} retweets
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{(post.totalEngagement || 0).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">total engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
