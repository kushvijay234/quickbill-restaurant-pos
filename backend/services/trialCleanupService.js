const { getMasterModels } = require('../config/masterDb');
const { getTenantConnection, closeTenantConnection } = require('../config/tenantManager');

/**
 * Periodically prunes heavy temporary operational data for free trial tenants
 * whose 14-day trial ended over 30 days ago and who never subscribed.
 * 
 * CRITICAL: The Tenant master record (email, phone, credentials, slug) is NEVER deleted,
 * so the user can never claim another free trial, and can log in at any time in the future
 * to restore/reactivate their account by paying.
 */
async function cleanExpiredTrialData() {
  const { Tenant, Subscription } = getMasterModels();
  if (!Tenant) return { processed: 0, pruned: 0 };

  const now = new Date();
  // Threshold: 30 days past trial expiration
  const thirtyDaysPastExpiry = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // Find candidate tenants:
    // 1. status is 'trialing' or 'expired'
    // 2. trialEndsAt < thirtyDaysPastExpiry (trial expired > 30 days ago)
    // 3. dataPruned is not true
    const expiredCandidates = await Tenant.find({
      status: { $in: ['trialing', 'expired'] },
      trialEndsAt: { $lt: thirtyDaysPastExpiry },
      dataPruned: { $ne: true }
    });

    if (!expiredCandidates || expiredCandidates.length === 0) {
      return { processed: 0, pruned: 0 };
    }

    console.log(`[Trial Cleanup] Found ${expiredCandidates.length} candidate tenant(s) with trial expired > 30 days ago.`);

    let prunedCount = 0;

    for (const tenant of expiredCandidates) {
      try {
        // Double check they have no active paid subscription
        const activeSub = await Subscription.findOne({
          tenantId: tenant._id,
          status: 'active'
        });

        if (activeSub) {
          // If they have an active subscription, ensure status is synced and skip
          await Tenant.findByIdAndUpdate(tenant._id, { status: 'active' });
          continue;
        }

        // Connect to tenant DB to clean up heavy operational collections
        try {
          const { models } = await getTenantConnection(tenant.slug);
          
          // Purge heavy operational collections (orders and audit logs)
          if (models.Order) {
            await models.Order.deleteMany({});
          }
          if (models.Log) {
            await models.Log.deleteMany({});
          }
        } catch (dbErr) {
          console.warn(`[Trial Cleanup] Notice accessing tenant DB for ${tenant.slug}:`, dbErr.message);
        }

        // Close connection in pool
        await closeTenantConnection(tenant.slug);

        // Update Tenant Master record: keep credentials, mark status 'expired' & dataPruned true
        await Tenant.findByIdAndUpdate(tenant._id, {
          status: 'expired',
          dataPruned: true,
          dataPrunedAt: new Date()
        });

        prunedCount++;
        console.log(`[Trial Cleanup] Successfully pruned inactive trial operational data for tenant: ${tenant.slug} (${tenant.ownerEmail}). Master login credentials preserved.`);

      } catch (tErr) {
        console.error(`[Trial Cleanup] Error cleaning tenant ${tenant.slug}:`, tErr.message);
      }
    }

    return { processed: expiredCandidates.length, pruned: prunedCount };

  } catch (err) {
    console.error('[Trial Cleanup Error]:', err.message);
    return { processed: 0, pruned: 0, error: err.message };
  }
}

module.exports = {
  cleanExpiredTrialData
};
