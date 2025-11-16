import { Zap } from 'lucide-react';

interface CreditsDisplayProps {
  usage: any;
  onNavigate: (page: string) => void;
}

export default function CreditsDisplay({ usage, onNavigate }: CreditsDisplayProps) {
  if (!usage) return null;

  return (
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-xl">
      <Zap className="w-5 h-5 text-yellow-500" />
      <div className="text-left">
        <p className="text-sm font-medium text-foreground">
          {usage.currentUsage || 0} / {usage.monthlyLimit || 0} credits used
        </p>
        {usage.addonCredits > 0 && (
          <p className="text-xs text-green-600">+{usage.addonCredits} addon credits</p>
        )}
      </div>
      {((usage.currentUsage || 0) + (usage.addonCredits || 0)) >= (usage.monthlyLimit || 0) && (
        <div className="ml-2">
          <button
            onClick={() => onNavigate('billing')}
            className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            Add Credits
          </button>
        </div>
      )}
    </div>
  );
}
