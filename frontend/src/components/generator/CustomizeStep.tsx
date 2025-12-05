import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

interface CustomizeStepProps {
  topic: string;
  aiInstructions: string;
  setAiInstructions: (instructions: string) => void;
  isGenerating: boolean;
  usage: any;
  handleGenerate: () => void;
  setCurrentStep: (step: number) => void;
}

export default function CustomizeStep({
  topic,
  aiInstructions,
  setAiInstructions,
  isGenerating,
  usage,
  handleGenerate,
  setCurrentStep
}: CustomizeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* AI Content Guidance */}
      <div className="p-8 rounded-2xl bg-white" style={{
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b7ba3' }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#1a1a1a' }}>Content Guidance</h3>
            <p className="text-base" style={{ color: '#6b7280' }}>Describe what kind of content you want, or key points you don't want to miss (optional)</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            className="modern-input min-h-[120px] text-base py-4 resize-none"
            placeholder="e.g., 'Focus on actionable tips for beginners' or 'Make it conversational and include specific examples' or 'Don't forget to mention the pricing strategy'"
          />
          <div className="absolute bottom-4 right-4 text-sm" style={{ color: '#9ca3af' }}>
            {aiInstructions.length}/500
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            'Make it beginner-friendly',
            'Include specific examples',
            'Focus on actionable tips',
            'Keep it conversational',
            'Add personal stories'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setAiInstructions(aiInstructions + (aiInstructions ? ', ' : '') + suggestion.toLowerCase())}
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
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          onClick={() => setCurrentStep(2)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-5 rounded-xl font-bold text-base transition-all"
          style={{
            backgroundColor: '#ffffff',
            color: '#1a1a1a',
            border: '2px solid #e5e7eb'
          }}
        >
          ← Back
        </motion.button>
        <motion.button
          onClick={handleGenerate}
          disabled={
            isGenerating || !topic.trim() || (usage && (usage.remaining !== undefined ? usage.remaining <= 0 : (usage.creditsUsed || 0) >= (usage.maxCredits || 0)))
          }
          whileHover={!isGenerating && topic.trim() ? { scale: 1.02, y: -2 } : {}}
          whileTap={!isGenerating && topic.trim() ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-bold text-base transition-all text-white"
          style={{
            backgroundColor: isGenerating || !topic.trim() || (usage && (usage.remaining !== undefined ? usage.remaining <= 0 : (usage.creditsUsed || 0) >= (usage.maxCredits || 0)))
              ? '#d1d5db'
              : '#6b7ba3',
            boxShadow: (!isGenerating && topic.trim()) ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
            cursor: (isGenerating || !topic.trim() || (usage && (usage.remaining !== undefined ? usage.remaining <= 0 : (usage.creditsUsed || 0) >= (usage.maxCredits || 0)))) ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : usage && (usage.remaining !== undefined ? usage.remaining <= 0 : (usage.creditsUsed || 0) >= (usage.maxCredits || 0)) ? (
            <>
              <Zap className="w-6 h-6" />
              No Credits Remaining
            </>
          ) : (
            <>
              <ArrowRight className="w-6 h-6" />
              Generate X Posts (1 credit)
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
