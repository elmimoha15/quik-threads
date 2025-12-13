import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../lib/userService';
import { CreatorTypeStep } from './CreatorTypeStep';
import { PlanSelectionStep } from './PlanSelectionStep';
import { ReferralSourceStep } from './ReferralSourceStep';
import { EmailVerificationStep } from './EmailVerificationStep';
import { TwitterConnectionStep } from './TwitterConnectionStep';
import { CompletionStep } from './CompletionStep';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface OnboardingData {
  creatorType: string;
  planType: 'free' | 'pro' | 'business';
  referralSource: string;
  twitterConnected: boolean;
}

interface OnboardingFlowProps {
  onNavigate: (page: string) => void;
}

export function OnboardingFlow({ onNavigate }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    creatorType: '',
    planType: 'free',
    referralSource: '',
    twitterConnected: false,
  });

  const { currentUser, refreshUserProfile } = useAuth();

  const totalSteps = 6;

  useEffect(() => {
    // Check for payment success redirect
    // Parameters are in the hash after '?' (e.g., /#/onboarding?step=5&checkout=success)
    const hashParts = window.location.hash.split('?');
    const urlParams = new URLSearchParams(hashParts[1] || '');
    const checkoutStatus = urlParams.get('checkout');
    const plan = urlParams.get('plan');
    const step = urlParams.get('step');

    if (checkoutStatus === 'success' && plan) {
      toast.success(`🎉 Payment successful! Welcome to ${plan === 'pro' ? 'Pro' : 'Business'}!`, {
        duration: 5000,
        icon: '✨',
      });
      
      // Update plan type in onboarding data
      setOnboardingData(prev => ({
        ...prev,
        planType: plan as 'pro' | 'business'
      }));

      // Set current step from URL (should be step 5 - Twitter connection)
      if (step) {
        setCurrentStep(parseInt(step));
      }

      // Clean up URL - remove query params from hash
      window.location.hash = hashParts[0];
    }
  }, []);

  const updateOnboardingData = (field: keyof OnboardingData, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!currentUser) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await UserService.completeOnboarding(currentUser.uid, onboardingData);
      await refreshUserProfile();
      
      // Navigate to dashboard after successful completion
      toast.success('Welcome to QuikThread! 🎉');
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.creatorType !== '';
      case 2:
        return true; // Plan is always valid since we have a default
      case 3:
        return onboardingData.referralSource !== '';
      case 4:
        return true; // Email verification step
      case 5:
        return true; // Twitter connection step (optional)
      case 6:
        return true; // Completion step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreatorTypeStep
            selectedType={onboardingData.creatorType}
            onSelect={(type) => updateOnboardingData('creatorType', type)}
          />
        );
      case 2:
        return (
          <PlanSelectionStep
            selectedPlan={onboardingData.planType}
            onSelect={(plan) => updateOnboardingData('planType', plan)}
          />
        );
      case 3:
        return (
          <ReferralSourceStep
            selectedSource={onboardingData.referralSource}
            onSelect={(source) => updateOnboardingData('referralSource', source)}
          />
        );
      case 4:
        return (
          <EmailVerificationStep
            onVerified={() => handleNext()}
          />
        );
      case 5:
        return (
          <TwitterConnectionStep
            onConnect={async (connected) => {
              updateOnboardingData('twitterConnected', connected.toString());
              // If we're on step 5 (Twitter connection), automatically complete onboarding
              // This is typically reached after payment redirect
              await completeOnboarding();
            }}
            onSkip={async () => {
              // Also complete onboarding if user skips
              await completeOnboarding();
            }}
          />
        );
      case 6:
        return (
          <CompletionStep
            onboardingData={onboardingData}
            loading={loading}
            error={error}
            onComplete={completeOnboarding}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Welcome to QuikThread</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
