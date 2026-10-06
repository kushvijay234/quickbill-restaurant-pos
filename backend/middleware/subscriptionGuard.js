const { getMasterModels } = require('../config/masterDb');

/**
 * Middleware to enforce SaaS subscription access rules.
 * Allows read access during grace periods, blocks mutations (POST/PUT/DELETE)
 * when subscription has expired or lapsed.
 */
async function subscriptionGuard(req, res, next) {
  // If no tenant context is attached, proceed (e.g. non-tenant public routes)
  if (!req.tenant) {
    return next();
  }

  const tenant = req.tenant;
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

  // Exempt billing / subscription management endpoints so owners can pay
  if (req.originalUrl.includes('/api/subscription') || req.originalUrl.includes('/api/auth/login')) {
    return next();
  }

  try {
    const { Tenant, Subscription } = getMasterModels();
    const now = new Date();

    // 1. Check Free Trial
    if (tenant.status === 'trialing') {
      const trialEndsAt = new Date(tenant.trialEndsAt);
      if (now > trialEndsAt) {
        // Trial expired
        if (isMutation) {
          return res.status(403).json({
            code: 'TRIAL_EXPIRED',
            message: 'Your 3-day free trial has expired. Please choose a subscription plan to continue creating orders and updating menus.',
            trialEnded: true
          });
        }
      }
      return next();
    }

    // 2. Check Active Subscription
    if (tenant.status === 'active') {
      const sub = await Subscription.findOne({ tenantId: tenant._id });
      if (sub && sub.currentPeriodEnd && now > new Date(sub.currentPeriodEnd)) {
        // Past billing period
        const gracePeriodEnd = sub.gracePeriodEndsAt || new Date(new Date(sub.currentPeriodEnd).getTime() + 3 * 24 * 60 * 60 * 1000);
        
        if (now > gracePeriodEnd) {
          // Grace period elapsed - update to suspended
          await Tenant.findByIdAndUpdate(tenant._id, { status: 'suspended' });
          if (isMutation) {
            return res.status(403).json({
              code: 'SUBSCRIPTION_EXPIRED',
              message: 'Subscription has expired and grace period ended. Please renew to resume operations.',
              expired: true
            });
          }
        }
      }
      return next();
    }

    // 3. Suspended or Cancelled status
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      if (isMutation) {
        return res.status(403).json({
          code: 'ACCOUNT_SUSPENDED',
          message: 'Restaurant account is currently suspended due to inactive subscription. Please update your billing.',
          status: tenant.status
        });
      }
    }

    next();
  } catch (err) {
    console.error('[SubscriptionGuard Error]:', err.message);
    // Don't block requests if Master DB has a transient check error
    next();
  }
}

module.exports = {
  subscriptionGuard
};
