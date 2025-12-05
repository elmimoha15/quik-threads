import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import Editor from './pages/Editor';
import Threads from './pages/Threads';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Processing from './pages/Processing';

type Page =
  | 'landing'
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'dashboard'
  | 'generator'
  | 'editor'
  | 'threads'
  | 'uploads'
  | 'analytics'
  | 'settings'
  | 'billing'
  | 'processing'
;

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const { currentUser, userProfile, loading } = useAuth();

  useEffect(() => {
    if (currentUser && userProfile) {
      // Check if user has completed onboarding
      if (!userProfile.onboardingCompleted) {
        if (currentPage !== 'onboarding') {
          setCurrentPage('onboarding');
        }
      } else {
        // Redirect authenticated users to dashboard if on auth pages
        if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'signup' || currentPage === 'onboarding') {
          setCurrentPage('dashboard');
        }
      }
    }
    // Redirect unauthenticated users to landing from protected pages
    else if (!currentUser && !['landing', 'login', 'signup'].includes(currentPage)) {
      setCurrentPage('landing');
    }
  }, [currentUser, userProfile, currentPage]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QuikThread...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {currentPage === 'landing' && <Landing onNavigate={handleNavigate} />}
      {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
      {currentPage === 'signup' && <Signup onNavigate={handleNavigate} />}
      {currentPage === 'onboarding' && <OnboardingFlow />}
      {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {currentPage === 'generator' && <Generator onNavigate={handleNavigate} />}
      {currentPage === 'editor' && <Editor onNavigate={handleNavigate} />}
      {currentPage === 'threads' && <Threads onNavigate={handleNavigate} />}
      {currentPage === 'uploads' && <Generator onNavigate={handleNavigate} />}
      {currentPage === 'analytics' && <Analytics onNavigate={handleNavigate} />}
      {currentPage === 'settings' && <Settings onNavigate={handleNavigate} />}
      {currentPage === 'billing' && <Billing onNavigate={handleNavigate} />}
      {currentPage === 'processing' && <Processing onNavigate={handleNavigate} />}
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              fontWeight: '500',
            },
            success: {
              duration: 5000,
              style: {
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #10b981',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ffffff',
                color: '#1a1a1a',
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
