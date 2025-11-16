import { useState } from 'react';
import { CheckCircle, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailVerificationStepProps {
  onVerified: () => void;
}

export function EmailVerificationStep({ onVerified }: EmailVerificationStepProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { currentUser } = useAuth();

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsVerified(true);
    setIsVerifying(false);
    
    // Auto-proceed after a short delay
    setTimeout(() => {
      onVerified();
    }, 1000);
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {isVerified ? (
            <CheckCircle className="w-10 h-10 text-green-500" />
          ) : (
            <Mail className="w-10 h-10 text-blue-600" />
          )}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {isVerified ? 'Email Verified!' : 'Verify Your Email'}
        </h2>
        
        <p className="text-lg text-gray-600 mb-2">
          {isVerified 
            ? 'Great! Your email has been verified successfully.'
            : 'Please verify your email address to continue setting up your account.'
          }
        </p>
        
        <p className="text-sm text-gray-500">
          {currentUser?.email}
        </p>
      </div>

      {!isVerified && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-gray-700 mb-4">
            Click the button below to verify your email address. This helps us ensure 
            account security and enables important notifications.
          </p>
        </div>
      )}

      {isVerified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center text-green-800">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Email verified successfully!</span>
          </div>
        </div>
      ) : (
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-medium"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              Verifying...
            </>
          ) : (
            <>
              <Mail className="w-6 h-6 mr-3" />
              Verify Email
            </>
          )}
        </button>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Having trouble? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}
