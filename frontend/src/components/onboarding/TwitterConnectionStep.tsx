import { useState } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TwitterConnectionStepProps {
  onConnect: (connected: boolean) => void;
  onSkip: () => void;
}

export function TwitterConnectionStep({ onConnect, onSkip }: TwitterConnectionStepProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      // Get Firebase auth token
      const token = await currentUser?.getIdToken();
      
      // Open Twitter OAuth in a popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/twitter/auth${token ? `?token=${token}` : ''}`;
      
      const authWindow = window.open(
        authUrl,
        'Twitter Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        // Verify origin if needed
        if (event.data.type === 'twitter-auth-success') {
          setConnected(true);
          setConnecting(false);
          onConnect(true);
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
        } else if (event.data.type === 'twitter-auth-error') {
          setError('Failed to connect to X. Please try again.');
          setConnecting(false);
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!authWindow) {
        setError('Popup was blocked. Please allow popups for this site.');
        setConnecting(false);
      }

      // Handle popup being closed without completing auth
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          if (!connected) {
            setConnecting(false);
            window.removeEventListener('message', handleMessage);
          }
        }
      }, 500);

    } catch (err: any) {
      setError(err.message || 'Failed to connect to X');
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#d1fae5' }}
        >
          <Twitter className="w-8 h-8" style={{ color: '#10b981' }} />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f1a14' }}>
          Connect Your X Account
        </h2>
        <p className="text-lg" style={{ color: '#6b7280' }}>
          Post your generated threads directly to X with one click
        </p>
      </div>

      {/* Benefits Section */}
      <div className="mb-8 p-6 rounded-2xl" style={{ 
        backgroundColor: '#f8faf9',
        border: '1px solid #e5e7eb'
      }}>
        <h3 className="font-bold text-lg mb-4" style={{ color: '#0f1a14' }}>
          Why connect X?
        </h3>
        <div className="space-y-3">
          {[
            'Post threads directly from QuikThread',
            'Schedule posts for optimal engagement',
            'Track performance and analytics',
            'Save time with one-click posting'
          ].map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
              >
                <Check className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>
              <p className="text-base" style={{ color: '#0f1a14' }}>
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      {connected ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl mb-6"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981'
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#10b981' }}
            >
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-base" style={{ color: '#10b981' }}>
                Successfully Connected!
              </h4>
              <p className="text-sm" style={{ color: '#059669' }}>
                Your X account is now linked to QuikThread
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Connect Button */}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full px-6 py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3"
              style={{
                backgroundColor: connecting ? '#6b7280' : '#10b981',
                boxShadow: '0 4px 6px -1px rgb(16 185 129 / 0.3), 0 2px 4px -2px rgb(16 185 129 / 0.2)'
              }}
              onMouseEnter={(e) => {
                if (!connecting) {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
              }}
            >
              {connecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Twitter className="w-5 h-5" />
                  Connect X Account
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl flex items-start gap-3"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                <p className="text-sm" style={{ color: '#dc2626' }}>
                  {error}
                </p>
              </motion.div>
            )}
          </div>
        </>
      )}

      {/* Skip Option */}
      <div className="text-center pt-6" style={{ borderTop: '1px solid #e5e7eb' }}>
        <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
          You can connect your X account later from Settings
        </p>
        <button
          onClick={onSkip}
          className="text-sm font-medium hover:underline"
          style={{ color: '#10b981' }}
        >
          Skip for now
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#f8faf9' }}>
        <p className="text-xs text-center" style={{ color: '#6b7280' }}>
          🔒 Your credentials are securely stored and encrypted. 
          We never post without your explicit permission.
        </p>
      </div>
    </div>
  );
}
