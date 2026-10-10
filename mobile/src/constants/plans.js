/**
 * Canonical SaaS Subscription Plans
 * Kept identical across Web POS, Mobile App, and Super Admin Master DB
 */
export const CANONICAL_PLANS = [
  {
    planId: 'starter',
    name: 'Starter Tier',
    description: 'Perfect for small cafes and food kiosks starting out',
    priceInr: 999,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 3,
      maxMenuItems: 50,
      maxOrdersPerMonth: 500,
      tableManagement: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  {
    planId: 'pro',
    name: 'Professional Business',
    description: 'Ideal for busy restaurants needing full table & order analytics',
    priceInr: 2499,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 15,
      maxMenuItems: 500,
      maxOrdersPerMonth: -1, // Unlimited
      tableManagement: true,
      analytics: true,
      prioritySupport: true,
      customBranding: false,
    },
  },
  {
    planId: 'enterprise',
    name: 'Enterprise Multi-Chain',
    description: 'For restaurant chains, franchise groups, and high-volume dining',
    priceInr: 5999,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 100,
      maxMenuItems: 5000,
      maxOrdersPerMonth: -1, // Unlimited
      tableManagement: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
];
