const express = require('express');
const jwt = require('jsonwebtoken');
const { getMasterModels, DEFAULT_PLANS } = require('../config/masterDb');
const { protectSuperAdmin } = require('../middleware/superAdminAuth');

const router = express.Router();

/**
 * @desc    SuperAdmin Login (Master Control Plane)
 * @route   POST /api/superadmin/login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, username, emailOrUsername, password } = req.body;
  const rawInput = (emailOrUsername || email || username || '').toLowerCase().trim();

  if (!rawInput || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password' });
  }

  try {
    const { SuperAdmin } = getMasterModels();

    const superAdmin = await SuperAdmin.findOne({
      $or: [
        { email: rawInput },
        { username: rawInput }
      ]
    }).select('+password');

    if (!superAdmin) {
      return res.status(401).json({ message: 'Invalid SuperAdmin credentials' });
    }

    const isMatch = await superAdmin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid SuperAdmin credentials' });
    }

    const token = jwt.sign(
      {
        id: superAdmin._id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: 'superadmin',
        isSuperAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      superadmin: {
        id: superAdmin._id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role
      }
    });
  } catch (err) {
    console.error('[SuperAdmin Login Error]:', err);
    res.status(500).json({ message: 'Server error during SuperAdmin authentication' });
  }
});

// Protect all subsequent routes with protectSuperAdmin
router.use(protectSuperAdmin);

/**
 * @desc    Get Current SuperAdmin Profile
 * @route   GET /api/superadmin/me
 * @access  SuperAdmin
 */
router.get('/me', (req, res) => {
  res.json({
    success: true,
    superadmin: req.superAdmin
  });
});

/**
 * @desc    Platform-wide Overview & Key Performance Metrics
 * @route   GET /api/superadmin/stats
 * @access  SuperAdmin
 */
router.get('/stats', async (req, res) => {
  try {
    const { Tenant, Subscription, Plan } = getMasterModels();

    const [
      totalTenants,
      activeTenants,
      trialingTenants,
      suspendedTenants,
      expiredTenants,
      dataPrunedTenants,
      recentTenants,
      currencyStats,
      plans
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: 'active' }),
      Tenant.countDocuments({ status: 'trialing' }),
      Tenant.countDocuments({ status: 'suspended' }),
      Tenant.countDocuments({ status: 'expired' }),
      Tenant.countDocuments({ dataPruned: true }),
      Tenant.find().sort({ createdAt: -1 }).limit(5),
      Tenant.aggregate([
        { $group: { _id: '$settings.currency', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Plan.find({ isActive: true })
    ]);

    // Calculate Estimated MRR based on active tenants and plan pricing
    const planPriceMap = {};
    plans.forEach(p => {
      planPriceMap[p.planId] = p.priceMonthly || 0;
    });

    const activeSubscriptions = await Subscription.find({ status: 'active' });
    let estimatedMRR = 0;
    activeSubscriptions.forEach(sub => {
      estimatedMRR += planPriceMap[sub.planId] || 999;
    });

    res.json({
      success: true,
      stats: {
        totalTenants,
        activeTenants,
        trialingTenants,
        suspendedTenants,
        expiredTenants,
        dataPrunedTenants,
        estimatedMRR,
        currencyStats,
        recentTenants
      }
    });
  } catch (err) {
    console.error('[SuperAdmin Stats Error]:', err);
    res.status(500).json({ message: 'Failed to fetch platform metrics' });
  }
});

/**
 * @desc    List & Search All Restaurant Tenants
 * @route   GET /api/superadmin/tenants
 * @access  SuperAdmin
 */
router.get('/tenants', async (req, res) => {
  try {
    const { Tenant } = getMasterModels();
    const { search = '', status = '', page = 1, limit = 25 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { slug: regex },
        { ownerEmail: regex },
        { ownerPhone: regex },
        { ownerName: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [tenants, total] = await Promise.all([
      Tenant.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Tenant.countDocuments(query)
    ]);

    res.json({
      success: true,
      tenants,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('[SuperAdmin Tenants Error]:', err);
    res.status(500).json({ message: 'Failed to retrieve tenants' });
  }
});

/**
 * @desc    Get Detailed Tenant Info
 * @route   GET /api/superadmin/tenants/:id
 * @access  SuperAdmin
 */
router.get('/tenants/:id', async (req, res) => {
  try {
    const { Tenant, Subscription } = getMasterModels();
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const subscription = await Subscription.findOne({ tenantId: tenant._id });

    res.json({
      success: true,
      tenant,
      subscription
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get tenant details' });
  }
});

/**
 * @desc    Manually Update Tenant Status (Activate / Suspend / Cancel)
 * @route   PATCH /api/superadmin/tenants/:id/status
 * @access  SuperAdmin
 */
router.patch('/tenants/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['active', 'trialing', 'suspended', 'cancelled', 'expired'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
  }

  try {
    const { Tenant, Subscription } = getMasterModels();

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Sync subscription record
    await Subscription.findOneAndUpdate(
      { tenantId: tenant._id },
      { status: status === 'active' ? 'active' : status === 'trialing' ? 'trialing' : 'inactive' }
    );

    res.json({
      success: true,
      message: `Tenant status updated to '${status}' successfully.`,
      tenant
    });
  } catch (err) {
    console.error('[SuperAdmin Status Update Error]:', err);
    res.status(500).json({ message: 'Failed to update tenant status' });
  }
});

/**
 * @desc    Manually Extend Free Trial Period
 * @route   POST /api/superadmin/tenants/:id/extend-trial
 * @access  SuperAdmin
 */
router.post('/tenants/:id/extend-trial', async (req, res) => {
  const days = parseInt(req.body.days, 10);

  if (!days || days < 1) {
    return res.status(400).json({ message: 'Please specify a valid number of days (minimum 1)' });
  }

  try {
    const { Tenant, Subscription } = getMasterModels();
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const now = new Date();
    const baseDate = (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > now)
      ? new Date(tenant.trialEndsAt)
      : now;

    const newTrialEndsAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    tenant.trialEndsAt = newTrialEndsAt;
    tenant.status = 'trialing';
    tenant.dataPruned = false;
    await tenant.save();

    await Subscription.findOneAndUpdate(
      { tenantId: tenant._id },
      {
        status: 'trialing',
        trialEndsAt: newTrialEndsAt,
        currentPeriodEnd: newTrialEndsAt
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Free trial extended by ${days} days until ${newTrialEndsAt.toLocaleDateString()}.`,
      tenant
    });
  } catch (err) {
    console.error('[SuperAdmin Extend Trial Error]:', err);
    res.status(500).json({ message: 'Failed to extend trial' });
  }
});

/**
 * @desc    Manually Override / Grant Subscription Plan
 * @route   POST /api/superadmin/tenants/:id/override-plan
 * @access  SuperAdmin
 */
router.post('/tenants/:id/override-plan', async (req, res) => {
  const { planId, months = 1 } = req.body;
  const validPlans = ['starter', 'pro', 'professional', 'enterprise'];

  if (!validPlans.includes(planId)) {
    return res.status(400).json({ message: `Invalid plan. Must be one of: ${validPlans.join(', ')}` });
  }

  try {
    const { Tenant, Subscription } = getMasterModels();
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000);

    tenant.activePlan = planId;
    tenant.status = 'active';
    tenant.dataPruned = false;
    await tenant.save();

    await Subscription.findOneAndUpdate(
      { tenantId: tenant._id },
      {
        planId,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        gracePeriodEndsAt: new Date(periodEnd.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Tenant upgraded to '${planId}' plan with active status.`,
      tenant
    });
  } catch (err) {
    console.error('[SuperAdmin Plan Override Error]:', err);
    res.status(500).json({ message: 'Failed to override plan' });
  }
});

/**
 * @desc    Get Platform Plans
 * @route   GET /api/superadmin/plans
 * @access  SuperAdmin
 */
router.get('/plans', async (req, res) => {
  try {
    const { Plan } = getMasterModels();
    const plans = await Plan.find().sort({ priceMonthly: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve plans' });
  }
});

module.exports = router;
