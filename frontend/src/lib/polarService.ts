// Polar Service - Now calls backend to create checkouts securely
// OAT tokens should never be exposed in frontend code

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CheckoutCreateParams {
  planType: 'pro' | 'business';
  customerEmail: string;
  customerName?: string;
  userId: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  productId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  customerId: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  invoicePdf?: string;
}

class PolarService {
  /**
   * Create a checkout session via backend
   * This keeps the OAT token secure on the server
   */
  async createCheckout(params: CheckoutCreateParams): Promise<string> {
    try {
      console.log('Creating checkout via backend:', params);
      
      const response = await fetch(`${API_URL}/api/polar/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: params.planType,
          customer_email: params.customerEmail,
          customer_name: params.customerName,
          user_id: params.userId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to create checkout' }));
        console.error('Backend error:', error);
        throw new Error(error.detail || 'Failed to create checkout');
      }
      
      const data = await response.json();
      console.log('Checkout created successfully:', data);
      
      return data.checkout_url;
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  /**
   * Redirect user to checkout page
   */
  async checkoutAndRedirect(params: CheckoutCreateParams): Promise<void> {
    try {
      const checkoutUrl = await this.createCheckout(params);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout redirect failed:', error);
      throw error;
    }
  }

  // NOTE: The following methods (getSubscriptions, cancelSubscription, etc.)
  // should also be moved to backend endpoints for security in production.
  // For now, they're not used in the checkout flow.
}

export default new PolarService();
