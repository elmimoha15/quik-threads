import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Heart, Repeat2, MessageCircle } from 'lucide-react';

const sampleTweets = [
  {
    text: "🧵 Just spent 3 hours creating content. Here's what I learned about productivity that nobody talks about...",
    likes: 234,
    retweets: 89,
    replies: 45,
  },
  {
    text: "1/ The biggest myth about content creation is that you need to be everywhere. Wrong. Focus on ONE platform and master it first.",
    likes: 189,
    retweets: 67,
    replies: 23,
  },
  {
    text: "2/ Your long-form content is a goldmine. Most creators record a podcast or video and just... post it. What about Twitter? LinkedIn? That's 90% of potential reach wasted.",
    likes: 256,
    retweets: 103,
    replies: 34,
  },
];

export function DemoPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Turn hours of content into engaging threads that people actually read
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#516289]/20 to-transparent blur-3xl" />

          <div className="relative flex flex-col gap-6 md:gap-8 max-w-2xl mx-auto">
            {sampleTweets.map((tweet, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, rotateY: 10 }}
                animate={isInView ? { opacity: 1, x: 0, rotateY: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                style={{
                  transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
                }}
                className="hover:rotate-0 transition-transform duration-300"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#596c96] to-[#4a5b7f] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">Q</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">QuikThread</span>
                        <span className="text-gray-500">@quikthread</span>
                        <span className="text-gray-400">· 2h</span>
                      </div>
                      <p className="text-gray-900 leading-relaxed">{tweet.text}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 hover:text-red-500 cursor-pointer transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">{tweet.likes}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-green-500 cursor-pointer transition-colors">
                      <Repeat2 className="w-5 h-5" />
                      <span className="text-sm font-medium">{tweet.retweets}</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-blue-500 cursor-pointer transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{tweet.replies}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
