import { motion } from 'framer-motion';
import { Check, CreditCard, Download, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import polarService from '../lib/polarService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface BillingProps {
  onNavigate: (page: string) => void;
}

const plans = [
  {
    id: 'free',
    name: 'Free Tier',
    subtitle: 'For new creators',
    price: '$0',
    period: 'forever',
    features: [
      '2 uploads/month',
      '1 generated thread per upload', 
      'Basic analytics (views & engagement)',
      'No X auto-posting'
    ],
    current: false,
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    subtitle: 'For active creators',
    price: '$20',
    period: 'per month',
    features: [
      '10 uploads/month',
      'AI-enhanced threads with tone customization',
      'Auto-post directly to X',
      'Engagement analytics with X integration',
      'Priority generation speed'
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Creator Plus',
    subtitle: 'For full-time creators & agencies',
    price: '$64',
    period: 'per month',
    features: [
      'Unlimited uploads',
      'Full thread & single-post generation',
      'Deep X analytics with premium API',
      'Scheduled posting',
      'Brand tone memory (AI learns your style)',
      'Team workspace & collaboration'
    ],
  },
];

export default function Billing({ onNavigate }: BillingProps) {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);
  // Reserved for future billing data (will be fetched from backend endpoints)
  const [subscriptions] = useState<any[]>([]);
  const [invoices] = useState<any[]>([]);
  const [customer] = useState<any>(null);

  useEffect(() => {
    loadBillingData();
    
    // Check for upgrade success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgrade') === 'success') {
      toast.success('Upgrade successful! Your account has been updated.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentUser]);

  const loadBillingData = async () => {
    if (!currentUser?.email) {
      setLoading(false);
      return;
    }

    try {
      // TODO: Move these methods to backend endpoints for security
      // For now, billing data fetching is disabled
      // const customerData = await polarService.getCustomerByEmail(currentUser.email);
      // setCustomer(customerData);

      // if (customerData) {
      //   const subs = await polarService.getSubscriptions(customerData.id);
      //   setSubscriptions(subs);
      //   const invs = await polarService.getInvoices(customerData.id);
      //   setInvoices(invs);
      // }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!currentUser?.email) {
      toast.error('Please log in to continue');
      return;
    }

    // Only allow upgrade for pro and business plans
    if (planId !== 'pro' && planId !== 'business') {
      return;
    }

    setProcessingUpgrade(true);

    try {
      // New backend-based checkout
      await polarService.checkoutAndRedirect({
        planType: planId as 'pro' | 'business',
        customerEmail: currentUser.email,
        customerName: currentUser.displayName || undefined,
        userId: currentUser.uid,
      });
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to start upgrade process');
      setProcessingUpgrade(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!customer) {
      toast.error('No active subscription found');
      return;
    }

    try {
      // TODO: Move customer portal to backend endpoint
      // const portalUrl = await polarService.createCustomerPortalSession(customer.id);
      // if (portalUrl) {
      //   window.open(portalUrl, '_blank');
      // } else {
      //   toast.error('Unable to open customer portal');
      // }
      toast.error('Customer portal temporarily unavailable. Please contact support.');
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open customer portal');
    }
  };

  const getCurrentPlan = () => {
    return userProfile?.tier || 'free';
  };

  const currentPlanId = getCurrentPlan();
  const currentPlan = plans.find(p => p.id === currentPlanId) || plans[0];

  // Mark current plan
  const plansWithCurrent = plans.map(p => ({
    ...p,
    current: p.id === currentPlanId,
  }));

  const formatInvoiceDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatInvoiceAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100); // Polar amounts are in cents
  };
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8faf9' }}>
      <Sidebar currentPage="billing" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#0f1a14' }}>Billing & Plans</h1>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
              <p className="text-gray-600">Loading billing information...</p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-8 mb-8"
                style={{
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#0f1a14' }}>
                      Current Plan: {currentPlan.name}
                    </h2>
                    <p style={{ color: '#6b7280' }}>
                      {currentPlan.subtitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold mb-1" style={{ color: '#10b981' }}>
                      {userProfile?.currentCredits || 0} / {userProfile?.maxCredits || 2}
                    </p>
                    <p className="text-sm" style={{ color: '#6b7280' }}>generations remaining</p>
                  </div>
                </div>
                <div className="mt-4 w-full rounded-full h-3" style={{ backgroundColor: '#e5e7eb' }}>
                  <div 
                    className="h-3 rounded-full" 
                    style={{ 
                      width: `${((userProfile?.currentCredits || 0) / (userProfile?.maxCredits || 2)) * 100}%`, 
                      backgroundColor: '#10b981' 
                    }} 
                  />
                </div>
                {subscriptions.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Active Subscription</p>
                        <p className="text-sm text-gray-500">
                          {subscriptions[0].cancelAtPeriodEnd 
                            ? `Cancels on ${new Date(subscriptions[0].currentPeriodEnd).toLocaleDateString()}`
                            : `Renews on ${new Date(subscriptions[0].currentPeriodEnd).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                      <button
                        onClick={handleManageSubscription}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition"
                      >
                        Manage Subscription
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>

              <div className="mb-12">
                <h2 className="text-xl font-bold mb-6" style={{ color: '#0f1a14' }}>
                  {currentPlanId === 'free' ? 'Upgrade Your Plan' : 'Available Plans'}
                </h2>
                {processingUpgrade && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <p className="text-emerald-800">Redirecting to secure checkout...</p>
                  </div>
                )}
                <div className="grid md:grid-cols-3 gap-6">
                  {plansWithCurrent.map((plan, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-xl p-8 relative`}
                      style={{
                        border: plan.popular ? '2px solid #10b981' : '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                      }}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium text-white"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          Most Popular
                        </div>
                      )}
                      {plan.current && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: '#0f1a14', color: 'white' }}
                        >
                          Current Plan
                        </div>
                      )}
                      <h3 className="text-2xl font-bold" style={{ color: '#0f1a14' }}>{plan.name}</h3>
                      <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{plan.subtitle}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-bold" style={{ color: '#0f1a14' }}>{plan.price}</span>
                        <span className="text-sm" style={{ color: '#6b7280' }}>/{plan.period}</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                            <span style={{ color: '#0f1a14' }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        disabled={plan.current || processingUpgrade}
                        onClick={() => plan.id !== 'free' && handleUpgrade(plan.id)}
                        className="w-full py-3 px-6 rounded-xl font-medium transition text-white"
                        style={{
                          backgroundColor: plan.current ? '#e5e7eb' : (plan.popular ? '#10b981' : 'transparent'),
                          color: plan.current ? '#9ca3af' : (plan.popular ? 'white' : '#10b981'),
                          border: plan.popular || plan.current ? 'none' : '2px solid #10b981',
                          cursor: plan.current || processingUpgrade ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {plan.current ? 'Current Plan' : 'Upgrade Now'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all mb-8"
              >
                <h2 className="text-xl font-bold mb-6 text-foreground">Payment Method</h2>
                {customer && subscriptions.length > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Payment method on file</p>
                        <p className="text-sm text-muted-foreground">Managed through Polar.sh</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleManageSubscription}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition flex items-center gap-2"
                    >
                      Manage Payment
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No payment method on file</p>
                        <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                      </div>
                    </div>
                    {currentPlanId === 'free' && (
                      <button 
                        onClick={() => handleUpgrade('pro')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition"
                      >
                        Add Card
                      </button>
                    )}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <h2 className="text-xl font-bold mb-6 text-foreground">Billing History</h2>
                {invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-xl transition bg-muted/50 hover:bg-muted border border-border"
                      >
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="font-medium text-foreground">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatInvoiceDate(invoice.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid'
                                ? 'text-green-400 border border-green-500/30'
                                : 'text-yellow-400 border border-yellow-500/30'
                            }`}
                            style={{
                              backgroundColor: invoice.status === 'paid'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)'
                            }}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-foreground">
                            {formatInvoiceAmount(invoice.amount, invoice.currency)}
                          </p>
                          {invoice.invoicePdf && (
                            <a
                              href={invoice.invoicePdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-muted rounded-lg transition"
                            >
                              <Download className="w-5 h-5 text-muted-foreground" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No billing history</p>
                    <p className="text-sm text-gray-500">
                      Your invoices will appear here after your first payment
                    </p>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
