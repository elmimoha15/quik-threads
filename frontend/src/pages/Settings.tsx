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
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="settings" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Settings</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl">
                  {success}
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <h2 className="text-xl font-bold mb-6 text-foreground">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full pl-12 pr-4 py-3 bg-muted border border-border rounded-xl outline-none transition opacity-60 cursor-not-allowed text-muted-foreground"
                      />
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">AI Preferences</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3 text-foreground">
                    Default Thread Tone
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['witty', 'professional', 'educational'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`py-3 px-4 rounded-xl border-2 font-medium transition capitalize ${
                          tone === t
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-foreground hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-bold mb-6 text-foreground">Appearance</h2>
              <div>
                <label className="block text-sm font-medium mb-3 text-foreground">
                  Theme
                </label>
                <div className="flex items-center gap-4">
                  <button
                    className="flex-1 py-4 rounded-xl border-2 font-medium transition border-primary bg-primary text-primary-foreground"
                  >
                    Light Mode
                  </button>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">
                  Light mode only - optimized for the best user experience
                </p>
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
