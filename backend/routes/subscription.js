const express = require('express');
const { getMasterModels } = require('../config/masterDb');
const { razorpayInstance, verifyPaymentSignature, verifyWebhookSignature, getKeyId } = require('../config/razorpay');
const { resolveTenant } = require('../middleware/tenantResolver');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all available SaaS subscription plans
// @route   GET /api/subscription/plans
router.get('/plans', async (req, res) => {
  try {
    const { Plan } = getMasterModels();
    const plans = await Plan.find({ isActive: true }).sort({ priceInr: 1 });
    res.json({
      success: true,
      plans,
      razorpayKeyId: getKeyId()
    });
  } catch (err) {
    console.error('[Subscription Plans Error]:', err.message);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
});

// @desc    Get current tenant's subscription details
// @route   GET /api/subscription/current
router.get('/current', resolveTenant(), async (req, res) => {
  try {
    const { Tenant, Subscription, Plan } = getMasterModels();
    const tenant = req.tenant;

    const currentSub = await Subscription.findOne({ tenantId: tenant._id }).sort({ createdAt: -1 });
    const activePlan = await Plan.findOne({ planId: tenant.activePlan || 'starter' });

    const now = new Date();
    let daysRemaining = 0;

    if (tenant.status === 'trialing' && tenant.trialEndsAt) {
      const diffTime = new Date(tenant.trialEndsAt) - now;
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else if (currentSub && currentSub.currentPeriodEnd) {
      const diffTime = new Date(currentSub.currentPeriodEnd) - now;
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
        activePlan: tenant.activePlan,
        trialEndsAt: tenant.trialEndsAt
      },
      subscription: currentSub,
      plan: activePlan,
      daysRemaining,
      razorpayKeyId: getKeyId()
    });
  } catch (err) {
    console.error('[Subscription Current Error]:', err.message);
    res.status(500).json({ message: 'Error retrieving subscription status' });
  }
});

// @desc    Create Razorpay Order for plan subscription / renewal
// @route   POST /api/subscription/create-order
router.post('/create-order', resolveTenant(), protect, async (req, res) => {
  const { planId, billingCycle = 'monthly' } = req.body;

  try {
    const { Plan } = getMasterModels();
    const plan = await Plan.findOne({ planId });

    if (!plan) {
      return res.status(404).json({ message: 'Selected plan not found' });
    }

    const price = billingCycle === 'yearly' 
      ? Math.round(plan.priceInr * 12 * 0.8) // 20% annual discount
      : plan.priceInr;

    const amountInPaise = Math.round(price * 100);

    // If Razorpay instance is in test placeholder mode, generate a mock order for smooth dev/testing
    let order;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${req.tenant.slug}_${Date.now()}`.substring(0, 40),
        notes: {
          tenantSlug: req.tenant.slug,
          planId: plan.planId,
          billingCycle
        }
      });
    } else {
      // Mock order for dev environment
      order = {
        id: `order_mock_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `mock_rcpt_${Date.now()}`
      };
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getKeyId(),
      plan: {
        planId: plan.planId,
        name: plan.name,
        priceInr: price,
        billingCycle
      }
    });

  } catch (err) {
    console.error('[Razorpay Order Creation Error]:', err);
    res.status(500).json({ message: 'Failed to initiate Razorpay order: ' + err.message });
  }
});

// @desc    Verify Razorpay payment signature & activate subscription
// @route   POST /api/subscription/verify-payment
router.post('/verify-payment', resolveTenant(), protect, async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    planId,
    billingCycle = 'monthly'
  } = req.body;

  try {
    const { Tenant, Subscription, Plan } = getMasterModels();

    // Verify signature if live credentials configured
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
      }
    }

    const plan = await Plan.findOne({ planId });
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    const periodStart = new Date();
    const periodEnd = new Date(periodStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Upsert tenant subscription
    let sub = await Subscription.findOne({ tenantId: req.tenant._id });
    if (!sub) {
      sub = new Subscription({
        tenantId: req.tenant._id,
        planId: plan.planId,
        status: 'active',
        billingCycle,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        razorpayPaymentId: razorpay_payment_id,
        amount: plan.priceInr,
        invoices: [{
          invoiceId: `INV-${Date.now()}`,
          amount: plan.priceInr,
          date: periodStart,
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id
        }]
      });
    } else {
      sub.planId = plan.planId;
      sub.status = 'active';
      sub.billingCycle = billingCycle;
      sub.currentPeriodStart = periodStart;
      sub.currentPeriodEnd = periodEnd;
      sub.razorpayPaymentId = razorpay_payment_id;
      sub.invoices.push({
        invoiceId: `INV-${Date.now()}`,
        amount: plan.priceInr,
        date: periodStart,
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id
      });
    }

    await sub.save();

    // Update Tenant active plan & status
    await Tenant.findByIdAndUpdate(req.tenant._id, {
      status: 'active',
      activePlan: plan.planId,
      dataPruned: false
    });

    res.json({
      success: true,
      message: `Subscription activated successfully for ${plan.name}!`,
      activePlan: plan.planId,
      currentPeriodEnd: periodEnd
    });

  } catch (err) {
    console.error('[Subscription Verification Error]:', err);
    res.status(500).json({ message: 'Error activating subscription: ' + err.message });
  }
});

// @desc    Razorpay Webhook handler
// @route   POST /api/subscription/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  if (process.env.RAZORPAY_WEBHOOK_SECRET) {
    const isValid = verifyWebhookSignature(req.body, signature);
    if (!isValid) {
      return res.status(400).send('Invalid webhook signature');
    }
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const event = payload.event;
  console.log(`[Razorpay Webhook Received]: ${event}`);

  try {
    const { Tenant, Subscription } = getMasterModels();

    if (event === 'payment.captured' || event === 'subscription.charged') {
      const notes = payload.payload?.payment?.entity?.notes || {};
      const tenantSlug = notes.tenantSlug;
      if (tenantSlug) {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (tenant) {
          await Tenant.findByIdAndUpdate(tenant._id, { status: 'active' });
        }
      }
    } else if (event === 'subscription.pending' || event === 'payment.failed') {
      const notes = payload.payload?.payment?.entity?.notes || {};
      const tenantSlug = notes.tenantSlug;
      if (tenantSlug) {
        const tenant = await Tenant.findOne({ slug: tenantSlug });
        if (tenant) {
          await Tenant.findByIdAndUpdate(tenant._id, { status: 'past_due' });
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

module.exports = router;
