const express = require('express');
const rateLimit = require('express-rate-limit');
const { getMasterModels } = require('../config/masterDb');
const { provisionTenant } = require('../services/tenantProvisioner');

const router = express.Router();

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 registrations per IP per hour
  message: { message: 'Too many restaurant registrations from this IP, please try again later.' }
});

// @desc    Register a new restaurant and start 14-day free trial (URL slug is auto-generated)
// @route   POST /api/saas/register
router.post('/register', registerLimiter, async (req, res) => {
  const {
    restaurantName,
    ownerName,
    ownerUsername,
    ownerEmail,
    ownerPassword,
    ownerPhone,
    currency,
    currencySymbol,
    slug // Optional, auto-generated if absent
  } = req.body;

  if (!restaurantName || !ownerEmail || !ownerPassword) {
    return res.status(400).json({
      message: 'Please provide restaurant name, email, and password.'
    });
  }

  // 1. Restaurant Name: max 69 characters
  if (restaurantName.trim().length > 69) {
    return res.status(400).json({ message: 'Restaurant name cannot exceed 69 characters.' });
  }

  // 2. Owner Name: max 30 characters
  if (ownerName && ownerName.trim().length > 30) {
    return res.status(400).json({ message: 'Owner name cannot exceed 30 characters.' });
  }

  // 3. Mobile Number: strictly 10 digits if provided
  if (ownerPhone && !/^\d{10}$/.test(ownerPhone.trim())) {
    return res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
  }

  // 4. Password: min 8 characters, at least 1 uppercase, 1 special character, 1 number
  if (ownerPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!/[A-Z]/.test(ownerPassword)) {
    return res.status(400).json({ message: 'Password must contain at least one uppercase letter (A-Z).' });
  }
  if (!/[0-9]/.test(ownerPassword)) {
    return res.status(400).json({ message: 'Password must contain at least one number (0-9).' });
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(ownerPassword)) {
    return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&* etc).' });
  }

  const cleanEmail = ownerEmail.toLowerCase().trim();
  const cleanPhone = (ownerPhone || '').trim();

  try {
    const { Tenant } = getMasterModels();

    // Check if user/tenant already registered with this email or phone number
    const existingTenant = await Tenant.findOne({
      $or: [
        { ownerEmail: cleanEmail },
        ...(cleanPhone ? [{ ownerPhone: cleanPhone }] : [])
      ]
    });

    if (existingTenant) {
      const isEmailMatch = existingTenant.ownerEmail === cleanEmail;
      const fieldMatched = isEmailMatch ? 'email address' : 'mobile number';
      const now = new Date();
      const isTrialActive = existingTenant.status === 'trialing' && existingTenant.trialEndsAt && new Date(existingTenant.trialEndsAt) > now;

      let message;
      if (isTrialActive) {
        message = `An account with this ${fieldMatched} already exists with an active free trial. Please log in to your restaurant portal.`;
      } else if (existingTenant.status === 'active') {
        message = `An account with this ${fieldMatched} already has an active subscription. Please log in to continue.`;
      } else {
        message = `An account with this ${fieldMatched} is already registered. Your free trial period has ended. Please log in to upgrade and restore your account.`;
      }

      return res.status(409).json({
        code: 'ACCOUNT_EXISTS',
        message,
        existingEmail: existingTenant.ownerEmail,
        status: existingTenant.status
      });
    }

    const result = await provisionTenant({
      name: restaurantName,
      slug: slug || undefined,
      ownerName: ownerName || restaurantName,
      ownerUsername,
      ownerEmail: cleanEmail,
      ownerPassword,
      ownerPhone: cleanPhone,
      currency: currency || 'INR',
      currencySymbol: currencySymbol || '₹'
    });

    res.status(201).json({
      success: true,
      message: `Welcome to RESTOBILL! Your account for ${restaurantName} is ready.`,
      ...result
    });
  } catch (err) {
    console.error('[Tenant Registration Error]:', err);
    res.status(err.statusCode || 500).json({
      message: err.message || 'Failed to create restaurant account'
    });
  }
});

module.exports = router;
