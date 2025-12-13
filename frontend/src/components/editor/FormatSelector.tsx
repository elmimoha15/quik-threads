import { motion } from 'framer-motion';
import { Zap, Flame, FileText, BookOpen, Lightbulb, List } from 'lucide-react';

export const FORMAT_LABELS = {
  one_liner: { name: 'One-Liner', icon: Zap, color: '#3b82f6', bgColor: '#eff6ff', description: 'Short, punchy statements (100-150 chars)' },
  hot_take: { name: 'Hot Take', icon: Flame, color: '#ef4444', bgColor: '#fef2f2', description: 'Bold opinions that spark conversation' },
  paragraph: { name: 'Paragraph', icon: FileText, color: '#8b5cf6', bgColor: '#faf5ff', description: 'Well-structured, complete thoughts' },
  mini_story: { name: 'Mini-Story', icon: BookOpen, color: '#10b981', bgColor: '#f0fdf4', description: 'Narrative-driven short stories' },
  insight: { name: 'Insight', icon: Lightbulb, color: '#f59e0b', bgColor: '#fffbeb', description: 'Value-packed educational content' },
  list_post: { name: 'List Post', icon: List, color: '#06b6d4', bgColor: '#ecfeff', description: 'Numbered or bulleted points' }
};

export type FormatType = keyof typeof FORMAT_LABELS;

interface FormatSelectorProps {
  selectedFormat: FormatType;
  onSelectFormat: (format: FormatType) => void;
  postCounts: Record<FormatType, number>;
}

export default function FormatSelector({ selectedFormat, onSelectFormat, postCounts }: FormatSelectorProps) {
  return (
    <div className="mb-8">
      <h2 className="font-semibold text-base mb-4" style={{ color: '#6b7280' }}>Select Post Format</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(FORMAT_LABELS).map(([key, data]) => {
          const formatKey = key as FormatType;
          const isSelected = selectedFormat === formatKey;
          const postsCount = postCounts[formatKey] || 0;
          const IconComponent = data.icon;
          
          return (
            <motion.button
              key={key}
              onClick={() => onSelectFormat(formatKey)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 rounded-2xl transition-all bg-white"
              style={{ 
                border: isSelected ? '2px solid #10b981' : '1px solid #e5e7eb',
                boxShadow: isSelected 
                  ? '0 4px 6px -1px rgb(16 185 129 / 0.3), 0 2px 4px -2px rgb(16 185 129 / 0.2)'
                  : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center mx-auto"
                style={{ backgroundColor: data.bgColor }}
              >
                <IconComponent className="w-6 h-6" style={{ color: data.color }} />
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#0f1a14' }}>
                {data.name}
              </div>
              <div className="text-xs font-medium" style={{ color: '#6b7280' }}>
                {postsCount} {postsCount === 1 ? 'variation' : 'variations'}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
