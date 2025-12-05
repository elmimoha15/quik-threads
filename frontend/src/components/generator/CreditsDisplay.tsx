import { Zap } from 'lucide-react';

interface CreditsDisplayProps {
  usage: any;
  onNavigate: (page: string) => void;
}

export default function CreditsDisplay({ usage, onNavigate }: CreditsDisplayProps) {
  if (!usage) return null;

  const creditsUsed = usage.creditsUsed || 0;
  const maxCredits = usage.maxCredits || 0;
  const remaining = usage.remaining !== undefined ? usage.remaining : Math.max(0, maxCredits - creditsUsed);

  return (
    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white" style={{
      border: '1px solid #e5e7eb'
    }}>
      <Zap className="w-5 h-5" style={{ color: '#f59e0b' }} />
      <div className="text-left">
        <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
          {creditsUsed} / {maxCredits} credits used
        </p>
        {remaining > 0 && (
          <p className="text-xs" style={{ color: '#10b981' }}>{remaining} remaining</p>
        )}
      </div>
      {remaining <= 0 && (
        <div className="ml-2">
          <button
            onClick={() => onNavigate('billing')}
            className="text-xs px-3 py-1 rounded-lg transition text-white"
            style={{
              backgroundColor: '#6b7ba3'
            }}
          >
            Add Credits
          </button>
        </div>
      )}
    </div>
  );
}
