import { api } from './api';

export const subscriptionService = {
  /**
   * Get tenant subscription status & limits
   */
  async getCurrentSubscription() {
    try {
      return await api.get('/subscription/current');
    } catch {
      return null;
    }
  },

  /**
   * Get available SaaS plans
   */
  async getPlans() {
    try {
      const res = await api.get('/subscription/plans');
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.plans)) return res.plans;
      if (res && Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Create Razorpay order for plan upgrade
   */
  async createOrder({ planId, billingCycle = 'monthly' }) {
    return await api.post('/subscription/create-order', { planId, billingCycle });
  },

  /**
   * Verify Razorpay payment and activate subscription
   */
  async verifyPayment(paymentData) {
    return await api.post('/subscription/verify-payment', paymentData);
  },
};
