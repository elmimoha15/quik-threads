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
      <div className="p-8 rounded-2xl bg-white" style={{
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b7ba3' }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>Topic or Idea</h3>
            <p className="text-base" style={{ color: '#6b7280' }}>What would you like to create X posts about?</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="modern-input min-h-[120px] text-base py-4 resize-none"
            placeholder="e.g., 'How to build a successful SaaS product' or 'The future of AI in marketing' or 'My experience launching a startup'"
          />
          <div className="absolute bottom-4 right-4 text-sm" style={{ color: '#9ca3af' }}>
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
              className="px-3 py-1.5 text-sm rounded-lg transition-all hover:scale-105 hover:bg-opacity-80"
              style={{
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                color: '#1a1a1a'
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
          className="w-full py-5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-4 mt-6 text-white"
          style={{
            backgroundColor: topic.trim() ? '#6b7ba3' : '#d1d5db',
            boxShadow: topic.trim() ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
            cursor: topic.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Continue to Content Source
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
