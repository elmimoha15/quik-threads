import { motion } from 'framer-motion';
import { Check, CreditCard, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';

interface BillingProps {
  onNavigate: (page: string) => void;
}

const plans = [
  {
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
    current: true,
  },
  {
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

const invoices = [
  { id: 'INV-001', date: 'Jan 1, 2024', amount: '$0.00', status: 'Paid' },
  { id: 'INV-002', date: 'Dec 1, 2023', amount: '$0.00', status: 'Paid' },
  { id: 'INV-003', date: 'Nov 1, 2023', amount: '$0.00', status: 'Paid' },
];

export default function Billing({ onNavigate }: BillingProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <Sidebar currentPage="billing" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: '#1a1a1a' }}>Billing & Plans</h1>

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
                <h2 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>Current Plan: Free</h2>
                <p style={{ color: '#6b7280' }}>You're on the free plan with 5 threads per month</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold mb-1" style={{ color: '#6b7ba3' }}>5 / 5</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>threads remaining</p>
              </div>
            </div>
            <div className="mt-4 w-full rounded-full h-3" style={{ backgroundColor: '#e5e7eb' }}>
              <div className="h-3 rounded-full" style={{ width: '100%', backgroundColor: '#6b7ba3' }} />
            </div>
          </motion.div>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6" style={{ color: '#1a1a1a' }}>Upgrade Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl p-8 relative`}
                  style={{
                    border: plan.popular ? '2px solid #6b7ba3' : '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: '#6b7ba3' }}
                    >
                      Most Popular
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: '#1a1a1a', color: 'white' }}
                    >
                      Current Plan
                    </div>
                  )}
                  <h3 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>{plan.subtitle}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold" style={{ color: '#1a1a1a' }}>{plan.price}</span>
                    <span className="text-sm" style={{ color: '#6b7280' }}>/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                        <span style={{ color: '#1a1a1a' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={plan.current}
                    className="w-full py-3 px-6 rounded-xl font-medium transition text-white"
                    style={{
                      backgroundColor: plan.current ? '#e5e7eb' : (plan.popular ? '#6b7ba3' : 'transparent'),
                      color: plan.current ? '#9ca3af' : (plan.popular ? 'white' : '#6b7ba3'),
                      border: plan.popular || plan.current ? 'none' : '2px solid #6b7ba3',
                      cursor: plan.current ? 'not-allowed' : 'pointer'
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
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No payment method on file</p>
                  <p className="text-sm text-muted-foreground">Add a payment method to upgrade</p>
                </div>
              </div>
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition">Add Card</button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-bold mb-6 text-foreground">Billing History</h2>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-xl transition bg-muted/50 hover:bg-muted border border-border"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-medium text-foreground">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'Paid'
                          ? 'text-green-400 border border-green-500/30'
                          : 'text-yellow-400 border border-yellow-500/30'
                      }`}
                      style={{
                        backgroundColor: invoice.status === 'Paid'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-foreground">{invoice.amount}</p>
                    <button className="p-2 hover:bg-muted rounded-lg transition">
                      <Download className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
