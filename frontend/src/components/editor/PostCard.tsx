import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { FORMAT_LABELS, FormatType } from './FormatSelector';
import PostToXButton from './PostToXButton';

interface PostCardProps {
  postContent: string;
  index: number;
  selectedFormat: FormatType;
  jobId?: string;
}

export default function PostCard({ postContent, index, selectedFormat, jobId }: PostCardProps) {
  const [copied, setCopied] = useState(false);
  const currentFormatData = FORMAT_LABELS[selectedFormat];

  const handleCopyPost = async () => {
    try {
      await navigator.clipboard.writeText(postContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{ 
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
      }}
    >
      {/* Tweet Card Header */}
      <div className="px-6 py-4" style={{ backgroundColor: '#f8faf9', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: currentFormatData.color }}
            >
              {index + 1}
            </div>
            <div>
              <span className="font-semibold text-base block" style={{ color: '#0f1a14' }}>
                Variation {index + 1}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
                {currentFormatData.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPost}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={copied 
                ? { 
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgb(16 185 129 / 0.3), 0 2px 4px -2px rgb(16 185 129 / 0.2)'
                  }
                : { 
                    border: '1px solid #e5e7eb',
                    color: '#0f1a14',
                    backgroundColor: '#ffffff'
                  }
              }
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = '#f8faf9';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <PostToXButton 
              postContent={postContent}
              jobId={jobId}
            />
          </div>
        </div>
      </div>

      {/* Tweet Card Content */}
      <div className="p-6">
        <div className="mb-5">
          <p className="whitespace-pre-wrap leading-relaxed text-base" style={{ color: '#0f1a14' }}>
            {postContent}
          </p>
        </div>
        
        {/* Tweet Card Footer */}
        <div className="pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: '#6b7280' }}>
              {postContent.length} characters
            </span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: postContent.length <= 280 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              color: postContent.length <= 280 ? '#10b981' : '#ef4444'
            }}
          >
            {postContent.length <= 280 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Within X limit
              </>
            ) : (
              <>
                ⚠ Over X limit
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
