import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../lib/userService';
import { CreatorTypeStep } from './CreatorTypeStep';
import { PlanSelectionStep } from './PlanSelectionStep';
import { ReferralSourceStep } from './ReferralSourceStep';
import { EmailVerificationStep } from './EmailVerificationStep';
import { CompletionStep } from './CompletionStep';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingData {
  creatorType: string;
  planType: 'free' | 'pro' | 'business';
  referralSource: string;
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    creatorType: '',
    planType: 'free',
    referralSource: '',
  });

  const { currentUser, refreshUserProfile } = useAuth();

  const totalSteps = 5;

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
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
