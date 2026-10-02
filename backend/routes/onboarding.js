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
    slug // Optional, auto-generated if absent
  } = req.body;

  if (!restaurantName || !ownerEmail || !ownerPassword) {
    return res.status(400).json({
      message: 'Please provide restaurant name, email, and password.'
    });
  }

  if (ownerPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const result = await provisionTenant({
      name: restaurantName,
      slug: slug || undefined,
      ownerName: ownerName || restaurantName,
      ownerUsername,
      ownerEmail,
      ownerPassword,
      ownerPhone
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
