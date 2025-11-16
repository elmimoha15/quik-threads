import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Podcast Host & Creator',
    avatar: 'SC',
    quote: 'QuikThread turned my 2-hour podcast into a viral thread that got 50k impressions. This tool is a game-changer for content creators.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'YouTube Content Creator',
    avatar: 'MR',
    quote: 'I was spending hours repurposing my videos. Now I just upload and go. The AI actually understands the context and pulls out the best moments.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Emily Thompson',
    role: 'Marketing Strategist',
    avatar: 'ET',
    quote: 'The quality of threads QuikThread generates is incredible. It\'s like having a content team working 24/7. My engagement has tripled.',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    name: 'David Park',
    role: 'Tech Educator',
    avatar: 'DP',
    quote: 'Finally, a tool that gets it. QuikThread doesn\'t just transcribe—it understands what makes content shareable. Absolutely worth it.',
    color: 'from-green-500 to-emerald-500',
  },
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Creators
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join hundreds of creators who are saving time and growing faster
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl hover:border-[#516289] transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10">
                  <Quote className="w-24 h-24 text-[#516289]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-bold text-lg">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
