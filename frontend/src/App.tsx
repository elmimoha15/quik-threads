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
import CheckoutSuccess from './pages/CheckoutSuccess';

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
  | 'checkout-success'
;

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [allowOnboardingOverride, setAllowOnboardingOverride] = useState(false);
  const { currentUser, userProfile, loading } = useAuth();

  // Handle hash-based routing (for external redirects like Polar)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2); // Remove '#/' prefix
      const [route, queryString] = hash.split('?'); // Get route and query params
      
      // Check if this is a payment redirect to onboarding
      if (route === 'onboarding' && queryString) {
        const urlParams = new URLSearchParams(queryString);
        if (urlParams.has('checkout') || urlParams.has('step')) {
          setAllowOnboardingOverride(true);
        }
      }
      
      if (route) {
        const validPages: Page[] = [
          'landing', 'login', 'signup', 'onboarding', 'dashboard',
          'generator', 'editor', 'threads', 'uploads', 'analytics',
          'settings', 'billing', 'processing', 'checkout-success'
        ];
        
        if (validPages.includes(route as Page)) {
          setCurrentPage(route as Page);
        }
      } else {
        // No hash, default to landing
        setCurrentPage('landing');
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // Empty dependency array - only run once on mount

  // Auth-based redirects - only when auth state changes
  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading

    // Check if URL has payment success or onboarding params (from external redirects)
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const hasCheckoutSuccess = urlParams.has('checkout');
    const hasStepParam = urlParams.has('step');
    
    // Don't auto-redirect if coming from payment or has explicit step, or if override is set
    if (hasCheckoutSuccess || hasStepParam || allowOnboardingOverride) {
      return;
    }

    const currentHash = window.location.hash.slice(2).split('?')[0];

    if (currentUser && userProfile) {
      // Check if user has completed onboarding
      if (!userProfile.onboardingCompleted) {
        if (currentHash !== 'onboarding') {
          setCurrentPage('onboarding');
          window.location.hash = '/onboarding';
        }
      } else {
        // Redirect authenticated users to dashboard if on auth pages or no page
        if (!currentHash || currentHash === 'landing' || currentHash === 'login' || currentHash === 'signup' || currentHash === 'onboarding') {
          setCurrentPage('dashboard');
          window.location.hash = '/dashboard';
        }
      }
    } else if (!currentUser) {
      // User is not logged in
      // Only redirect if they're trying to access protected pages
      const protectedPages = ['dashboard', 'generator', 'editor', 'threads', 'analytics', 'settings', 'billing', 'processing', 'onboarding'];
      if (currentHash && protectedPages.includes(currentHash)) {
        setCurrentPage('landing');
        window.location.hash = '/landing';
      }
    }
  }, [currentUser, userProfile, loading, allowOnboardingOverride]);

  const handleNavigate = (page: string) => {
    // Clear onboarding override when navigating to dashboard
    if (page === 'dashboard') {
      setAllowOnboardingOverride(false);
    }
    window.location.hash = `/${page}`;
    setCurrentPage(page as Page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
      {currentPage === 'onboarding' && <OnboardingFlow onNavigate={handleNavigate} />}
      {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {currentPage === 'generator' && <Generator onNavigate={handleNavigate} />}
      {currentPage === 'editor' && <Editor onNavigate={handleNavigate} />}
      {currentPage === 'threads' && <Threads onNavigate={handleNavigate} />}
      {currentPage === 'uploads' && <Generator onNavigate={handleNavigate} />}
      {currentPage === 'analytics' && <Analytics onNavigate={handleNavigate} />}
      {currentPage === 'settings' && <Settings onNavigate={handleNavigate} />}
      {currentPage === 'billing' && <Billing onNavigate={handleNavigate} />}
      {currentPage === 'processing' && <Processing onNavigate={handleNavigate} />}
      {currentPage === 'checkout-success' && <CheckoutSuccess />}
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
              color: '#0f1a14',
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
                color: '#0f1a14',
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
                color: '#0f1a14',
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
