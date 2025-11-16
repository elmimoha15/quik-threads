import { motion } from 'framer-motion';
import { Copy, Heart, MessageCircle, Repeat2, Share, Lock } from 'lucide-react';

interface LegacyPostCardProps {
  post: any;
  index: number;
  onCopy: (content: string) => void;
  onNavigate: (page: string) => void;
}

export default function LegacyPostCard({ post, index, onCopy, onNavigate }: LegacyPostCardProps) {
  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all shadow-sm"
    >
      {/* X Post Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {post.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground">{post.author.name}</h4>
            <span className="text-muted-foreground text-sm">{post.author.handle}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{post.timestamp}</span>
          </div>
        </div>
      </div>
      
      {/* X Post Content */}
      <div className="mb-4">
        <p className="text-foreground leading-relaxed">{post.content}</p>
      </div>
      
      {/* Engagement Stats */}
      <div className="flex items-center gap-6 mb-4 text-muted-foreground text-sm">
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{post.engagement.replies.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Repeat2 className="w-4 h-4" />
          <span>{post.engagement.retweets.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          <span>{post.engagement.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share className="w-4 h-4" />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onCopy(post.content)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={() => onNavigate('billing')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition font-medium"
        >
          <Lock className="w-4 h-4" />
          Legacy Demo
        </button>
      </div>
    </motion.div>
  );
}
