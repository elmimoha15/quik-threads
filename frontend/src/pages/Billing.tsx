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
    <div className="min-h-screen bg-background">
      <Sidebar currentPage="billing" onNavigate={onNavigate} />

      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Billing & Plans</h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all relative"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-6 text-foreground">Current Plan</h2>
                <p className="text-muted-foreground mb-4">Perfect for getting started</p>
                <p className="text-muted-foreground">You're on the free plan with 5 threads per month</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">5 / 5</p>
                  <p className="text-sm text-muted-foreground">threads remaining</p>
                </div>
              </div>
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-3">
              <div className="bg-primary h-3 rounded-full" style={{ width: '100%' }} />
            </div>
          </motion.div>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6 text-foreground">Available Plans</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${plan.popular ? 'ring-2 ring-primary shadow-xl' : ''} relative`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  {plan.current && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm mb-4 text-muted-foreground">{plan.subtitle}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={plan.current}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : plan.current ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
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
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}
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
