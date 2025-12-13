import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import { FORMAT_LABELS, FormatType } from './FormatSelector';

interface PostVariationsProps {
  variations: string[];
  selectedFormat: FormatType;
  jobId?: string;
}

export default function PostVariations({ variations, selectedFormat, jobId }: PostVariationsProps) {
  const currentFormatData = FORMAT_LABELS[selectedFormat];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedFormat}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {variations.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#0f1a14' }}>
                Post Variations ({variations.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {variations.map((postContent, index) => (
                <PostCard
                  key={index}
                  postContent={postContent}
                  index={index}
                  selectedFormat={selectedFormat}
                  jobId={jobId}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl" style={{ 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
          }}>
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: currentFormatData.bgColor }}
            >
              <currentFormatData.icon className="w-8 h-8" style={{ color: currentFormatData.color }} />
            </div>
            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>
              No {currentFormatData.name.toLowerCase()} posts available for this generation.
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
