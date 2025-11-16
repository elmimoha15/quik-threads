import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface StatusMessagesProps {
  postSuccess: string | null;
  error: string | null;
}

export default function StatusMessages({ postSuccess, error }: StatusMessagesProps) {
  return (
    <>
      {/* Success Message */}
      {postSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Thread posted successfully!</p>
            <a 
              href={postSuccess} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-600 hover:underline text-sm"
            >
              View on X →
            </a>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50"
        >
          <p className="text-red-600 font-medium">{error}</p>
        </motion.div>
      )}
    </>
  );
}
