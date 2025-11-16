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
      <div className="bg-white p-8 rounded-2xl border border-slate-100" style={{
        boxShadow: 'var(--card-shadow)',
        borderColor: 'var(--card-border)'
      }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Content Guidance</h3>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Describe what kind of content you want, or key points you don't want to miss (optional)</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            className="modern-input min-h-[120px] text-lg py-4 resize-none"
            placeholder="e.g., 'Focus on actionable tips for beginners' or 'Make it conversational and include specific examples' or 'Don't forget to mention the pricing strategy'"
          />
          <div className="absolute bottom-4 right-4 text-sm" style={{ color: 'var(--text-muted)' }}>
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
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          onClick={() => setCurrentStep(2)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-5 rounded-xl font-bold text-xl transition-all"
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-secondary)',
            border: '2px solid var(--card-border)'
          }}
        >
          ← Back
        </motion.button>
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || (usage && ((usage.currentUsage || 0) >= ((usage.monthlyLimit || 0) + (usage.addonCredits || 0))))}
          className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition ${
            isGenerating || !topic.trim() || (usage && ((usage.currentUsage || 0) >= ((usage.monthlyLimit || 0) + (usage.addonCredits || 0))))
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : usage && ((usage.currentUsage || 0) >= ((usage.monthlyLimit || 0) + (usage.addonCredits || 0))) ? (
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
