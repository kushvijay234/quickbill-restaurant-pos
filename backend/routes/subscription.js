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

// @desc    Render Razorpay mobile web checkout page
// @route   GET /api/subscription/checkout-page
router.get('/checkout-page', async (req, res) => {
  const {
    orderId,
    keyId = process.env.RAZORPAY_KEY_ID,
    amount,
    planId,
    planName = 'FASTBILLO Plan',
    tenantSlug,
    token,
    billingCycle = 'monthly'
  } = req.query;

  const displayAmount = amount ? (Number(amount) / 100).toFixed(2) : '0.00';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>FASTBILLO POS - Upgrade to ${planName}</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .card {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      padding: 28px 24px;
      width: 100%;
      max-width: 400px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .badge-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: #059669;
      color: #ffffff;
      font-size: 30px;
      margin-bottom: 14px;
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.25);
    }
    h1 {
      font-size: 22px;
      margin: 0 0 6px 0;
      font-weight: 800;
      color: #0f172a;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 20px;
    }
    .details {
      background: #f1f5f9;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 22px;
      text-align: left;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .row:last-child {
      margin-bottom: 0;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
      font-weight: 800;
      font-size: 17px;
    }
    .btn {
      background: #059669;
      color: white;
      border: none;
      padding: 15px 20px;
      font-size: 16px;
      font-weight: 700;
      border-radius: 12px;
      width: 100%;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);
      transition: all 0.2s;
    }
    .btn:active {
      transform: scale(0.98);
      background: #047857;
    }
    .status-box {
      margin-top: 18px;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.5;
    }
    .success {
      color: #065f46;
      background: #ecfdf5;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #a7f3d0;
    }
    .error {
      color: #991b1b;
      background: #fef2f2;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #fecaca;
    }
    .info {
      color: #1e40af;
      background: #eff6ff;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #bfdbfe;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge-icon">⚡</div>
    <h1>FASTBILLO POS</h1>
    <div class="subtitle">Complete payment securely with Razorpay</div>

    <div class="details">
      <div class="row">
        <span>Selected Plan</span>
        <span style="font-weight:700;">${planName}</span>
      </div>
      <div class="row">
        <span>Billing Cycle</span>
        <span>${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
      </div>
      <div class="row">
        <span>Total Payable</span>
        <span style="color:#059669;">₹${displayAmount}</span>
      </div>
    </div>

    <button id="payBtn" class="btn" onclick="openRazorpay()">Pay ₹${displayAmount} with Razorpay</button>

    <div id="status"></div>
  </div>

  <script>
    function openRazorpay() {
      const options = {
        key: "${keyId}",
        amount: "${amount}",
        currency: "INR",
        name: "FASTBILLO POS",
        description: "${planName} Subscription",
        order_id: "${orderId}",
        theme: { color: "#059669" },
        handler: function(response) {
          document.getElementById('status').innerHTML = '<div class="status-box info">⏳ Verifying payment with FASTBILLO server...</div>';
          document.getElementById('payBtn').style.display = 'none';

          fetch('/api/subscription/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${token}',
              'X-Tenant-ID': '${tenantSlug}'
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: "${planId}",
              billingCycle: "${billingCycle}"
            })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.success) {
              document.getElementById('status').innerHTML = '<div class="status-box success">🎉 <b>Payment Successful!</b><br>Your subscription has been activated.<br><br><b>Please switch back to the FASTBILLO POS app.</b></div>';
            } else {
              document.getElementById('payBtn').style.display = 'block';
              document.getElementById('status').innerHTML = '<div class="status-box error">Verification issue: ' + (data.message || 'Unknown error') + '</div>';
            }
          })
          .catch(function(err) {
            document.getElementById('payBtn').style.display = 'block';
            document.getElementById('status').innerHTML = '<div class="status-box error">Network error: ' + err.message + '</div>';
          });
        },
        modal: {
          ondismiss: function() {
            document.getElementById('status').innerHTML = '<div class="status-box info">Payment window closed. Tap the button above to retry anytime.</div>';
          }
        }
      };

      try {
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          document.getElementById('status').innerHTML = '<div class="status-box error">Payment was not completed: ' + (resp.error && resp.error.description ? resp.error.description : 'Failed') + '</div>';
        });
        rzp.open();
      } catch (err) {
        document.getElementById('status').innerHTML = '<div class="status-box error">Could not launch Razorpay: ' + err.message + '</div>';
      }
    }

    // Auto-launch checkout after page load
    window.onload = function() {
      setTimeout(openRazorpay, 350);
    };
  </script>
</body>
</html>`;

  res.send(html);
});

module.exports = router;
