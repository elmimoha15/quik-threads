import { Home, FileText, BarChart3, Settings, CreditCard, LogOut, Upload, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { usePlanAccess } from '../hooks/usePlanAccess';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'threads', label: 'X Posts', icon: FileText },
  { id: 'uploads', label: 'Uploads', icon: Upload },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser, logout, usageData } = useAuth();
  const { canAccessAnalytics, getCurrentPlan } = usePlanAccess();

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r p-6 flex flex-col" style={{ backgroundColor: '#0f1a14', borderColor: '#1a2e23' }}>
      <div className="flex items-center justify-center mb-8 h-16">
        <img 
          src="/assets/1.png" 
          alt="QuikThread Logo" 
          className="h-56 w-auto object-contain"
        />
      </div>

      {/* Modern User Profile Section */}
      {currentUser && (
        <div className="mb-8 p-5 border rounded-2xl" style={{ backgroundColor: '#1a2e23', borderColor: '#254535' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#10b981' }}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentUser.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          // Hide analytics for plans that don't have access
          if (item.id === 'analytics' && !canAccessAnalytics()) {
            return null;
          }

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{
                backgroundColor: isActive ? '#10b981' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#1a2e23';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Logout Button at Bottom */}
      <div className="space-y-4">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-400 hover:bg-red-900/20"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </motion.button>

        {/* Plan and Usage Info */}
        <div className="space-y-3">
          {/* Credits Usage */}
          {usageData && (
            <div className="p-3 rounded-xl text-white" style={{ backgroundColor: '#1a2e23', border: '1px solid #254535' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: '#10b981' }} />
                <p className="text-xs font-medium">Credits</p>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs opacity-80">Used this month</span>
                <span className="text-xs font-medium">
                  {usageData.creditsUsed || 0} / {usageData.maxCredits || 0}
                </span>
              </div>
              <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: '#254535' }}>
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(((usageData.creditsUsed || 0) / (usageData.maxCredits || 1)) * 100, 100)}%`,
                    backgroundColor: '#10b981'
                  }}
                />
              </div>
              {usageData.remaining !== undefined && (
                <p className="text-xs" style={{ color: '#10b981' }}>
                  {usageData.remaining} credits remaining
                </p>
              )}
            </div>
          )}

          {/* Plan Info */}
          <div className="p-3 rounded-xl text-white" style={{ backgroundColor: '#1a2e23', border: '1px solid #254535' }}>
            <p className="text-xs font-medium mb-1">Current Plan: {getCurrentPlan().charAt(0).toUpperCase() + getCurrentPlan().slice(1)}</p>
            {getCurrentPlan() !== 'business' && (
              <>
                <p className="text-xs opacity-80 mb-2 leading-tight">
                  {getCurrentPlan() === 'free' ? 'Upgrade to unlock more features' : 'Upgrade to Business for analytics'}
                </p>
                <button 
                  onClick={() => onNavigate('billing')}
                  className="w-full py-1.5 rounded-lg text-xs font-medium transition text-white hover:opacity-90"
                  style={{ backgroundColor: '#10b981' }}
                >
                  Upgrade Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
