import { CheckCircle, Loader2, AlertCircle, Zap, Crown, Gift } from 'lucide-react';

interface OnboardingData {
  creatorType: string;
  planType: string;
  referralSource: string;
}

interface CompletionStepProps {
  onboardingData: OnboardingData;
  loading: boolean;
  error: string;
  onComplete: () => void;
}

export function CompletionStep({ onboardingData, loading, error, onComplete }: CompletionStepProps) {
  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'free':
        return <Gift className="w-6 h-6 text-green-500" />;
      case 'pro':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'business':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'Free Plan';
      case 'pro':
        return 'Pro Plan';
      case 'business':
        return 'Business Plan';
      default:
        return planType;
    }
  };

  const getCreatorTypeName = (creatorType: string) => {
    const types: Record<string, string> = {
      youtuber: 'YouTuber',
      podcaster: 'Podcaster',
      blogger: 'Blogger',
      coach: 'Coach',
      entrepreneur: 'Entrepreneur',
      marketer: 'Marketer',
      educator: 'Educator',
      influencer: 'Influencer'
    };
    return types[creatorType] || creatorType;
  };

  const getReferralSourceName = (referralSource: string) => {
    const sources: Record<string, string> = {
      social_media: 'Social Media',
      google: 'Google Search',
      youtube: 'YouTube',
      friend: 'Friend/Colleague',
      blog: 'Blog/Article',
      other: 'Other'
    };
    return sources[referralSource] || referralSource;
  };

  return (
    <div>
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Almost Ready!</h2>
        <p className="text-lg text-gray-600">
          Review your selections and complete your QuikThread setup.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Setup Summary</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-500">Creator Type</span>
              <p className="text-gray-900">{getCreatorTypeName(onboardingData.creatorType)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-500">Subscription Plan</span>
              <div className="flex items-center mt-1">
                {getPlanIcon(onboardingData.planType)}
                <span className="ml-2 text-gray-900">{getPlanName(onboardingData.planType)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <span className="text-sm font-medium text-gray-500">How You Found Us</span>
              <p className="text-gray-900">{getReferralSourceName(onboardingData.referralSource)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            Your account will be set up with your selected plan
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            You'll get access to the dashboard and upload features
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            Start creating amazing content with AI-powered threads
          </li>
          {onboardingData.planType !== 'free' && (
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              Premium features will be activated immediately
            </li>
          )}
        </ul>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Setup Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            Setting up your account...
          </>
        ) : (
          'Complete Setup & Get Started'
        )}
      </button>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          By completing setup, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
