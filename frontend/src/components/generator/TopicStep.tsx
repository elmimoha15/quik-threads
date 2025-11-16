import { motion } from 'framer-motion';
import { FileText, ArrowRight } from 'lucide-react';

interface TopicStepProps {
  topic: string;
  setTopic: (topic: string) => void;
  setCurrentStep: (step: number) => void;
}

export default function TopicStep({ topic, setTopic, setCurrentStep }: TopicStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="bg-white p-8 rounded-2xl border border-slate-100" style={{
        boxShadow: 'var(--card-shadow)',
        borderColor: 'var(--card-border)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Topic or Idea</h3>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>What would you like to create X posts about?</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="modern-input min-h-[120px] text-lg py-4 resize-none"
            placeholder="e.g., 'How to build a successful SaaS product' or 'The future of AI in marketing' or 'My experience launching a startup'"
          />
          <div className="absolute bottom-4 right-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            {topic.length}/500
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'SaaS growth strategies',
            'AI and productivity',
            'Startup lessons learned',
            'Marketing automation',
            'Remote work tips'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setTopic(suggestion)}
              className="px-3 py-1.5 text-sm rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: 'var(--card-border)',
                backgroundColor: 'var(--background-secondary)',
                color: 'var(--text-secondary)'
              }}
            >
              + {suggestion}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={() => setCurrentStep(2)}
          disabled={!topic.trim()}
          whileHover={topic.trim() ? { scale: 1.02, y: -2 } : {}}
          whileTap={topic.trim() ? { scale: 0.98 } : {}}
          className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-4 mt-6 ${
            topic.trim()
              ? 'text-white cursor-pointer'
              : 'cursor-not-allowed text-white'
          }`}
          style={{
            background: topic.trim() ? 'var(--gradient-primary)' : 'var(--text-muted)',
            boxShadow: topic.trim() ? 'var(--shadow-lg)' : 'none'
          }}
        >
          Continue to Content Source
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
