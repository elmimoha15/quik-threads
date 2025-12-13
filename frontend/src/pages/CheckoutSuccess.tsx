import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CheckoutSuccess() {
  const { refreshUserProfile, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Refresh user profile to get updated tier info
    const refreshData = async () => {
      try {
        await refreshUserProfile();
        setLoading(false);
      } catch (err) {
        console.error('Failed to refresh profile:', err);
        setError('Failed to update account. Please contact support.');
        setLoading(false);
      }
    };

    // Wait a bit for webhook to process
    const timer = setTimeout(refreshData, 2000);
    return () => clearTimeout(timer);
  }, [refreshUserProfile]);

  const handleContinue = () => {
    // Redirect to dashboard by changing URL hash or similar
    window.location.href = '/';
  };

  const handleGoToBilling = () => {
    window.location.href = '/#/billing';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we update your account</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleGoToBilling}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Go to Billing
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {userProfile?.tier === 'business' ? 'Business' : 'Pro'}!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Your payment was successful and your account has been upgraded.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">What's included:</h3>
            <ul className="space-y-2 text-left">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  {userProfile?.maxCredits || 30} generations per month
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Post directly to X (Twitter)
                </span>
              </li>
              {userProfile?.tier === 'business' && (
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Advanced analytics dashboard
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Priority processing
                </span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-sm text-gray-500 mt-4">
            You can manage your subscription anytime from the billing page
          </p>
        </motion.div>
      </div>
    </div>
  );
}
