import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, Target, Zap, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Clock,
    title: 'Save Hours Every Week',
    description: 'What takes you 2-3 hours manually takes QuikThread under 60 seconds.',
  },
  {
    icon: Target,
    title: 'AI-Powered Precision',
    description: 'Our AI doesn\'t just transcribe—it understands context and extracts the gold.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Upload your content and get a polished thread in seconds, not hours.',
  },
  {
    icon: TrendingUp,
    title: 'Boost Engagement',
    description: 'Threads optimized for maximum reach and engagement on Twitter.',
  },
];

export function WhyDifferent() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose QuikThread?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The smartest way to repurpose your content
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex gap-6 p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300 group"
            >
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-[#516289] to-[#3d4a63] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-[#516289] to-[#3d4a63] rounded-3xl p-12 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Before QuikThread
              </h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Manually listening to hours of content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Writing and rewriting thread drafts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Inconsistent posting schedule</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Missing key insights and quotes</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-3xl font-bold mb-4">
                With QuikThread
              </h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI extracts insights in seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Ready-to-post threads instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Consistent, high-quality content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Never miss a viral moment</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
