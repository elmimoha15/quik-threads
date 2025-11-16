import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';

interface NavigationProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function Navigation({ onLogin, onSignup }: NavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-lg flex items-center justify-center">
              <span className="text-[#516289] font-bold text-lg">Q</span>
            </div>
            <span className="text-white font-bold text-xl">QuikThread</span>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-white/80">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </motion.button>
            
            <motion.button
              onClick={onSignup}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-2 bg-white text-[#516289] font-semibold rounded-full hover:shadow-lg transition-all duration-300"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
