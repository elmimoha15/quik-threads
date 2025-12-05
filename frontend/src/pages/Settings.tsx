import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Sparkles, Loader2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { UserProfile } from '../types/user.types';

interface SettingsProps {
  onNavigate: (page: string) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  // Mock user for display
  const currentUser = { uid: '1', displayName: 'John Doe', email: 'john@example.com' };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [name, setName] = useState('');
  const [tone, setTone] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Mock profile data
      const mockProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.displayName,
        plan: 'pro',
        twitter_connected: false,
        threads_created: 12,
        monthly_limit: 30,
        tone_preference: 'witty',
        created_at: new Date(),
        updated_at: new Date()
      };
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setProfile(mockProfile);
      setName(mockProfile.name);
      setTone(mockProfile.tone_preference || 'witty');
    } catch (err: any) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Mock profile update
      console.log('Mock: Profile updated with data:', { name, tone_preference: tone });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      setSuccess('Profile updated successfully!');
      await loadProfile();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Sidebar currentPage="settings" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#1a1a1a' }}>Settings</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6b7ba3' }} />
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-xl" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444'
                }}>
                  {error}
                </div>
              )}
              
              {success && (
                <div className="px-4 py-3 rounded-xl" style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981'
                }}>
                  {success}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-xl"
                style={{
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }}
              >
                <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9ca3af' }} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          color: '#1a1a1a'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#9ca3af' }} />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full pl-12 pr-4 py-3 rounded-xl outline-none transition opacity-60 cursor-not-allowed"
                        style={{
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          color: '#6b7280'
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                      Email cannot be changed
                    </p>
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-white"
                    style={{ backgroundColor: '#6b7ba3' }}
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-xl"
              style={{
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>AI Preferences</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#6b7280' }}>
                    Default Thread Tone
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Witty', 'Professional', 'Educational'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t.toLowerCase())}
                        className="py-3 px-4 rounded-xl font-medium transition capitalize text-white"
                        style={{
                          backgroundColor: tone === t.toLowerCase() ? '#6b7ba3' : 'transparent',
                          border: `2px solid ${tone === t.toLowerCase() ? '#6b7ba3' : '#e5e7eb'}`,
                          color: tone === t.toLowerCase() ? '#ffffff' : '#1a1a1a'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: '#6b7280' }}>
                    AI Creativity Level
                  </label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: '#6b7280' }}>Conservative</span>
                    <span className="text-sm font-bold" style={{ color: '#6b7ba3' }}>70%</span>
                    <span className="text-sm" style={{ color: '#6b7280' }}>Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="70"
                    className="w-full"
                    style={{ accentColor: '#6b7ba3' }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: '#9ca3af' }}>Conservative</span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>Balanced</span>
                    <span className="text-xs" style={{ color: '#9ca3af' }}>Creative</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-xl"
              style={{
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Appearance</h2>
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#6b7280' }}>
                  Theme
                </label>
                <div className="flex items-center gap-4">
                  <button
                    className="flex-1 py-4 rounded-xl font-medium transition text-white"
                    style={{
                      backgroundColor: '#6b7ba3',
                      border: '2px solid #6b7ba3'
                    }}
                  >
                    Light Mode
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">Current Plan</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-blue-100 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg capitalize text-foreground">
                      {profile?.plan || 'Free'} Plan
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {profile?.monthly_limit === -1 ? 'Unlimited' : profile?.monthly_limit} threads per month
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('billing')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition"
                >
                  Upgrade
                </button>
              </div>
            </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
