import { useState, useEffect } from 'react';
import { Check, Loader2, Zap, Crown, Gift } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    uploadsPerMonth: number;
    threadsPerUpload: number;
    maxFileSize: number;
  };
  popular?: boolean;
}

const defaultPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '2 generations per month',
      '30 min max duration',
      'Basic content creation',
      'Community support'
    ],
    limits: {
      uploadsPerMonth: 2,
      threadsPerUpload: 1,
      maxFileSize: 50
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    interval: 'month',
    features: [
      '30 generations per month',
      '60 min max duration',
      'Post to X directly',
      'AI tone customization',
      'Priority processing',
      'Email support'
    ],
    limits: {
      uploadsPerMonth: 30,
      threadsPerUpload: 1,
      maxFileSize: 200
    },
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 49,
    interval: 'month',
    features: [
      '100 generations per month',
      '60 min max duration',
      'Analytics dashboard',
      'Post to X directly',
      'Advanced AI features',
      'Priority support',
      'Team collaboration'
    ],
    limits: {
      uploadsPerMonth: 100,
      threadsPerUpload: 2,
      maxFileSize: 500
    }
  }
];

interface PlanSelectionStepProps {
  selectedPlan: string;
  onSelect: (plan: string) => void;
}

export function PlanSelectionStep({ selectedPlan, onSelect }: PlanSelectionStepProps) {
  const [plans] = useState<Plan[]>(defaultPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB >= 1000) {
      return `${sizeInMB / 1000}GB`;
    }
    return `${sizeInMB}MB`;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading subscription plans...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
        <p className="text-lg text-gray-600">
          Select the plan that best fits your content creation needs. You can upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 transition-all duration-200 cursor-pointer ${
              selectedPlan === plan.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onSelect(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Crown className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  {plan.id === 'free' && <Gift className="w-6 h-6 text-green-500 mr-2" />}
                  {plan.id === 'pro' && <Zap className="w-6 h-6 text-blue-500 mr-2" />}
                  {plan.id === 'business' && <Crown className="w-6 h-6 text-purple-500 mr-2" />}
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">/{plan.interval}</span>
                  )}
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <div>
                    {plan.limits.uploadsPerMonth === -1 
                      ? 'Unlimited uploads' 
                      : `${plan.limits.uploadsPerMonth} uploads per month`
                    }
                  </div>
                  <div>Up to {formatFileSize(plan.limits.maxFileSize)} per file</div>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Selected Plan:</strong> {plans.find(p => p.id === selectedPlan)?.name}
            {selectedPlan === 'free' && (
              <span className="ml-2 text-blue-600">
                • You can upgrade anytime to unlock more features
              </span>
            )}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          All plans include secure file storage and basic content generation. 
          Cancel or change your plan anytime.
        </p>
      </div>
    </div>
  );
}
