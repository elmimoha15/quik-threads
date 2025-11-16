import { motion } from 'framer-motion';
import { TrendingUp, Users, Heart, MessageCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '../components/Sidebar';

interface AnalyticsProps {
  onNavigate: (page: string) => void;
}

const weeklyData = [
  { day: 'Mon', threads: 2, engagement: 450 },
  { day: 'Tue', threads: 1, engagement: 320 },
  { day: 'Wed', threads: 3, engagement: 780 },
  { day: 'Thu', threads: 2, engagement: 520 },
  { day: 'Fri', threads: 4, engagement: 890 },
  { day: 'Sat', threads: 1, engagement: 280 },
  { day: 'Sun', threads: 2, engagement: 540 },
];

const topThreads = [
  { title: 'Content Creation Tips', engagement: 3100, likes: 245, retweets: 89 },
  { title: 'AI in 2024', engagement: 2450, likes: 198, retweets: 76 },
  { title: 'YouTube Growth', engagement: 2890, likes: 221, retweets: 82 },
];

export default function Analytics({ onNavigate }: AnalyticsProps) {

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="analytics" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Analytics</h1>

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
              <p className="text-3xl font-bold text-foreground">15.5%</p>
              <p className="text-sm text-green-600 mt-2">+3 this week</p>
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
              <p className="text-3xl font-bold text-foreground">2.1K</p>
              <p className="text-sm text-green-600 mt-2">+12% vs last week</p>
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
              <p className="text-3xl font-bold text-foreground">1,847</p>
              <p className="text-sm text-green-600 mt-2">+8% vs last week</p>
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
              <p className="text-3xl font-bold text-foreground">47.2K</p>
              <p className="text-sm text-green-600 mt-2">+1.3% vs last week</p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">X Posts Created This Week</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke='hsl(var(--border))' />
                  <XAxis dataKey="day" stroke='hsl(var(--muted-foreground))' />
                  <YAxis stroke='hsl(var(--muted-foreground))' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="threads" fill='hsl(var(--primary))' radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">Engagement Trend</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke='hsl(var(--border))' />
                  <XAxis dataKey="day" stroke='hsl(var(--muted-foreground))' />
                  <YAxis stroke='hsl(var(--muted-foreground))' />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke='hsl(var(--primary))'
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <h2 className="text-2xl font-bold mb-6 text-foreground">Performance Over Time</h2>
            <div className="space-y-4">
              {topThreads.map((thread, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl transition bg-muted/50 hover:bg-muted border border-border"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{thread.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {thread.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {thread.retweets} retweets
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{thread.engagement.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">total engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
