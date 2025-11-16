import { useState, useEffect } from 'react';
import { 
  Twitter, 
  Search, 
  Youtube, 
  Users, 
  FileText, 
  MoreHorizontal,
  Loader2 
} from 'lucide-react';

interface ReferralSource {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const defaultReferralSources: ReferralSource[] = [
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Found us on Twitter, LinkedIn, or other social platforms',
    icon: <Twitter className="w-8 h-8" />
  },
  {
    id: 'google',
    name: 'Google Search',
    description: 'Discovered through search engines',
    icon: <Search className="w-8 h-8" />
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Saw us in a video or advertisement',
    icon: <Youtube className="w-8 h-8" />
  },
  {
    id: 'friend',
    name: 'Friend/Colleague',
    description: 'Recommended by someone you know',
    icon: <Users className="w-8 h-8" />
  },
  {
    id: 'blog',
    name: 'Blog/Article',
    description: 'Read about us in a blog post or article',
    icon: <FileText className="w-8 h-8" />
  },
  {
    id: 'other',
    name: 'Other',
    description: 'Found us through another source',
    icon: <MoreHorizontal className="w-8 h-8" />
  }
];

interface ReferralSourceStepProps {
  selectedSource: string;
  onSelect: (source: string) => void;
}

export function ReferralSourceStep({ selectedSource, onSelect }: ReferralSourceStepProps) {
  const [referralSources] = useState<ReferralSource[]>(defaultReferralSources);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Loading referral sources...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">How did you hear about us?</h2>
        <p className="text-lg text-gray-600">
          Help us understand how you discovered QuikThread so we can improve our outreach.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {referralSources.map((source) => (
          <button
            key={source.id}
            onClick={() => onSelect(source.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedSource === source.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`mb-4 ${selectedSource === source.id ? 'text-blue-600' : 'text-gray-600'}`}>
              {source.icon}
            </div>
            <h3 className={`font-semibold mb-2 ${selectedSource === source.id ? 'text-blue-900' : 'text-gray-900'}`}>
              {source.name}
            </h3>
            <p className={`text-sm ${selectedSource === source.id ? 'text-blue-700' : 'text-gray-600'}`}>
              {source.description}
            </p>
          </button>
        ))}
      </div>

      {selectedSource && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Selected:</strong> {referralSources.find(s => s.id === selectedSource)?.name}
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          This information helps us understand our audience better and improve our services.
        </p>
      </div>
    </div>
  );
}
