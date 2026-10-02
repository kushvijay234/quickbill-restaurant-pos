const express = require('express');
const rateLimit = require('express-rate-limit');
const DefaultUser = require('../models/user');
const { resolveTenant } = require('../middleware/tenantResolver');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// @desc    Login user with simple username/email and password (auto-routes to restaurant workspace)
// @route   POST /api/auth/login
router.post('/login', loginLimiter, resolveTenant({ optional: true }), async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Please provide a valid username or email and password' });
  }

  try {
    const cleanQuery = username.toLowerCase().trim();

    // If tenant context wasn't resolved by header or subdomain, look up in Master DB
    if (!req.tenantModels) {
      try {
        const { getMasterModels } = require('../config/masterDb');
        const { getTenantConnection } = require('../config/tenantManager');
        const { Tenant } = getMasterModels();

        const matchedTenant = await Tenant.findOne({
          $or: [
            { ownerEmail: cleanQuery },
            { ownerUsername: cleanQuery },
            { slug: cleanQuery }
          ]
        });

        if (matchedTenant) {
          const { models, tenant } = await getTenantConnection(matchedTenant.slug);
          req.tenantSlug = matchedTenant.slug;
          req.tenant = tenant;
          req.tenantModels = models;
        }
      } catch (mErr) {
        console.warn('[Auth Login] Master DB tenant lookup warning:', mErr.message);
      }
    }

    const UserModel = (req.tenantModels && req.tenantModels.User) || DefaultUser;
    
    // Find user in resolved workspace database
    const user = await UserModel.findOne({
      $or: [
        { username: username },
        { username: cleanQuery },
        ...(req.tenant?.ownerUsername ? [{ username: req.tenant.ownerUsername }] : [])
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    const token = user.getSignedJwtToken(req.tenantSlug);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      token,
      user: userResponse,
      tenant: req.tenant ? {
        slug: req.tenant.slug,
        name: req.tenant.name,
        status: req.tenant.status,
        activePlan: req.tenant.activePlan
      } : null
    });

  } catch (err) {
    console.error('[Login Error]:', err.message);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

module.exports = router;