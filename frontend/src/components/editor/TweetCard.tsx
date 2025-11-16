import { motion } from 'framer-motion';
import { Copy } from 'lucide-react';

interface TweetCardProps {
  tweet: any;
  index: number;
  userProfile: any;
  onCopy: (content: string) => void;
}

export default function TweetCard({ tweet, index, userProfile, onCopy }: TweetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all shadow-sm"
    >
      {/* Tweet Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{userProfile?.displayName || 'You'}</h4>
            <span className="text-muted-foreground text-sm">@{userProfile?.email?.split('@')[0] || 'user'}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">now</span>
          </div>
        </div>
      </div>
      
      {/* Tweet Content */}
      <div className="mb-4">
        <p className="text-foreground leading-relaxed whitespace-pre-line">{tweet.content}</p>
        <div className="mt-2 text-xs text-muted-foreground">
          {tweet.content.length}/280 characters
        </div>
      </div>
      
      {/* Tweet Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(tweet.content)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
      </div>
    </motion.div>
  );
}
