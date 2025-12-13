import { Sparkles, Loader2 } from 'lucide-react';
import Sidebar from '../Sidebar';

interface EmptyStateProps {
  onNavigate: (page: string) => void;
}

export function LoadingState({ onNavigate }: EmptyStateProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <Sidebar currentPage="editor" onNavigate={onNavigate} />
      <div className="ml-64 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: '#10b981' }} />
          <p className="text-sm font-medium" style={{ color: '#6b7280' }}>Loading your posts...</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ onNavigate }: EmptyStateProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <Sidebar currentPage="editor" onNavigate={onNavigate} />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="p-12 rounded-2xl bg-white" style={{ 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
          }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#d1fae5' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#10b981' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#0f1a14' }}>No Posts Yet</h2>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              Generate your first set of X posts to get started!
            </p>
            <button
              onClick={() => onNavigate('generator')}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ 
                backgroundColor: '#10b981',
                boxShadow: '0 4px 6px -1px rgb(16 185 129 / 0.3), 0 2px 4px -2px rgb(16 185 129 / 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02) translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
            >
              Generate Posts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
