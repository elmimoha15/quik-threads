import { useState } from 'react';
import { Twitter, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface PostToXButtonProps {
  postContent: string;
  disabled?: boolean;
  jobId?: string;
}

export default function PostToXButton({ postContent, disabled }: PostToXButtonProps) {
  const [opened, setOpened] = useState(false);

  const handlePostToX = () => {
    if (!postContent) return;

    // Encode the tweet content for URL
    const encodedText = encodeURIComponent(postContent);
    
    // Open X (Twitter) with the tweet pre-filled
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    // Open in new tab instead of popup
    window.open(twitterUrl, '_blank');
    
    // Show success state briefly
    setOpened(true);
    setTimeout(() => setOpened(false), 2000);
  };

  return (
    <div>
      <motion.button
        onClick={handlePostToX}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={opened 
          ? {
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: '1px solid #10b981'
            }
          : {
              backgroundColor: '#ffffff',
              color: '#0f1a14',
              border: '1px solid #e5e7eb'
            }
        }
        onMouseEnter={(e) => {
          if (!disabled && !opened) {
            e.currentTarget.style.backgroundColor = '#f8faf9';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !opened) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        {opened ? (
          <>
            <Check className="w-4 h-4" />
            Opened!
          </>
        ) : (
          <>
            <Twitter className="w-4 h-4" />
            Post to X
          </>
        )}
      </motion.button>
    </div>
  );
}
