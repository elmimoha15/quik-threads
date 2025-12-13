import { useState, useEffect } from 'react';
import { 
  Youtube, 
  Mic, 
  PenTool, 
  Users, 
  Briefcase, 
  TrendingUp, 
  GraduationCap, 
  Star,
  Loader2 
} from 'lucide-react';

interface CreatorType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const defaultCreatorTypes: CreatorType[] = [
  {
    id: 'youtuber',
    name: 'YouTuber',
    description: 'Create engaging video content for YouTube',
    icon: <Youtube className="w-8 h-8" />
  },
  {
    id: 'podcaster',
    name: 'Podcaster',
    description: 'Host and produce podcast episodes',
    icon: <Mic className="w-8 h-8" />
  },
  {
    id: 'blogger',
    name: 'Blogger',
    description: 'Write articles and blog posts',
    icon: <PenTool className="w-8 h-8" />
  },
  {
    id: 'coach',
    name: 'Coach',
    description: 'Provide coaching and mentorship',
    icon: <Users className="w-8 h-8" />
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Build and grow businesses',
    icon: <Briefcase className="w-8 h-8" />
  },
  {
    id: 'marketer',
    name: 'Marketer',
    description: 'Create marketing campaigns and content',
    icon: <TrendingUp className="w-8 h-8" />
  },
  {
    id: 'educator',
    name: 'Educator',
    description: 'Teach and share knowledge',
    icon: <GraduationCap className="w-8 h-8" />
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Build and engage with your audience',
    icon: <Star className="w-8 h-8" />
  }
];

interface CreatorTypeStepProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

export function CreatorTypeStep({ selectedType, onSelect }: CreatorTypeStepProps) {
  const [creatorTypes] = useState<CreatorType[]>(defaultCreatorTypes);
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
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
        <p className="text-gray-600">Loading creator types...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">What type of creator are you?</h2>
        <p className="text-lg text-gray-600">
          Help us personalize your QuikThread experience by selecting your primary creator type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {creatorTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-6 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
              selectedType === type.id
                ? 'border-emerald-500 bg-emerald-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`mb-4 ${selectedType === type.id ? 'text-emerald-600' : 'text-gray-600'}`}>
              {type.icon}
            </div>
            <h3 className={`font-semibold mb-2 ${selectedType === type.id ? 'text-emerald-900' : 'text-gray-900'}`}>
              {type.name}
            </h3>
            <p className={`text-sm ${selectedType === type.id ? 'text-emerald-700' : 'text-gray-600'}`}>
              {type.description}
            </p>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 text-sm">
            <strong>Selected:</strong> {creatorTypes.find(t => t.id === selectedType)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
