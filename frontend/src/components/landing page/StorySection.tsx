import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock, Users, TrendingUp, Sparkles } from 'lucide-react';

const stats = [
  {
    icon: Clock,
    value: '10+ Hours',
    label: 'Saved per week',
  },
  {
    icon: Users,
    value: '5x More',
    label: 'Audience reach',
  },
  {
    icon: TrendingUp,
    value: '300%',
    label: 'Engagement boost',
  },
  {
    icon: Sparkles,
    value: '< 60 Sec',
    label: 'Thread generation',
  },
];

export function StorySection() {
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
            The Problem We're Solving
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            You create amazing content. Hours of podcasts, thoughtful videos, in-depth articles.
            But here's the reality...
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 border border-red-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                The Manual Way
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Listen to your entire episode</p>
                    <p className="text-gray-600 text-sm">2-3 hours of focused listening</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Take notes and identify key moments</p>
                    <p className="text-gray-600 text-sm">Easy to miss the best parts</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Write and format your thread</p>
                    <p className="text-gray-600 text-sm">Another hour of editing and tweaking</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">4</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Hope it performs well</p>
                    <p className="text-gray-600 text-sm">No guarantee of engagement</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                The QuikThread Way
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Upload your content</p>
                    <p className="text-gray-600 text-sm">Drag and drop in seconds</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">AI analyzes everything</p>
                    <p className="text-gray-600 text-sm">Never miss a viral moment</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Get your perfect thread</p>
                    <p className="text-gray-600 text-sm">Formatted and ready to post</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">4</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Watch engagement soar</p>
                    <p className="text-gray-600 text-sm">Optimized for maximum reach</p>
                  </div>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-[#0f1a14] to-[#1a2e23] rounded-2xl p-6 text-white text-center hover:scale-105 transition-transform duration-300"
            >
              <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
