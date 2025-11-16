import { ExternalLink, Lock, Copy } from 'lucide-react';

interface ThreadHeaderProps {
  thread: any;
  threadIndex: number;
  canPostToX: boolean;
  isPosting: boolean;
  onPostToX: (index: number) => void;
  onNavigate: (page: string) => void;
  onCopyAll: (content: string) => void;
}

export default function ThreadHeader({
  thread,
  threadIndex,
  canPostToX,
  isPosting,
  onPostToX,
  onNavigate,
  onCopyAll
}: ThreadHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-xl font-semibold mb-2 text-foreground">
        {thread.hook || `Thread ${threadIndex + 1}`}
      </h3>
      <p className="text-muted-foreground mb-4">
        {thread.tweets?.length || 0} tweets in this thread
      </p>
      
      {/* Post Thread Button */}
      <div className="flex gap-3">
        {canPostToX ? (
          <button
            onClick={() => onPostToX(threadIndex)}
            disabled={isPosting}
            className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
              isPosting
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isPosting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Post Entire Thread to X
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => onNavigate('billing')}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Upgrade to Post
          </button>
        )}
        <button
          onClick={() => onCopyAll(thread.tweets?.map((t: any) => t.content).join('\n\n') || '')}
          className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy All Tweets
        </button>
      </div>
    </div>
  );
}
