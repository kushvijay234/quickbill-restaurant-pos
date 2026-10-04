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
      return await api.get('/subscription/plans');
    } catch {
      return [];
    }
  },
};
