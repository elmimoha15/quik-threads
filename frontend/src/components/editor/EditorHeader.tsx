import { ArrowLeft } from 'lucide-react';

interface EditorHeaderProps {
  source?: string;
  onNavigate: (page: string) => void;
}

export default function EditorHeader({ source, onNavigate }: EditorHeaderProps) {
  return (
    <div className="mb-8">
      <button
        onClick={() => onNavigate('threads')}
        className="flex items-center gap-2 hover:opacity-80 transition mb-4 text-sm font-medium group"
        style={{ color: '#6b7280' }}
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to X Posts
      </button>
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-4xl font-bold" style={{ color: '#0f1a14' }}>Generated X Posts</h1>
        <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
          color: '#10b981' 
        }}>
          Ready to share
        </div>
      </div>
      {source && (
        <p className="text-lg" style={{ color: '#6b7280' }}>
          Generated from: <span className="font-semibold" style={{ color: '#0f1a14' }}>{source}</span>
        </p>
      )}
    </div>
  );
}
