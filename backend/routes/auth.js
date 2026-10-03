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

// @desc    Login user with email and password (auto-routes to restaurant workspace)
// @route   POST /api/auth/login
router.post('/login', loginLimiter, resolveTenant({ optional: true }), async (req, res) => {
  const { email, username, password } = req.body;
  const inputEmail = (email || username || '').toLowerCase().trim();

  if (!inputEmail || !password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Please provide a valid email and password' });
  }

  try {
    // If tenant context wasn't resolved by header or subdomain, look up in Master DB
    if (!req.tenantModels) {
      try {
        const { getMasterModels } = require('../config/masterDb');
        const { getTenantConnection } = require('../config/tenantManager');
        const { Tenant } = getMasterModels();

        const matchedTenant = await Tenant.findOne({
          $or: [
            { ownerEmail: inputEmail },
            { ownerUsername: inputEmail },
            { slug: inputEmail }
          ]
        }).select('+passwordHash');

        if (matchedTenant) {
          try {
            const { models, tenant } = await getTenantConnection(matchedTenant.slug);
            req.tenantSlug = matchedTenant.slug;
            req.tenant = tenant;
            req.tenantModels = models;
          } catch (connErr) {
            req.tenantSlug = matchedTenant.slug;
            req.tenant = matchedTenant;
            req.tenantModels = null;
          }
        }
      } catch (mErr) {
        console.warn('[Auth Login] Master DB tenant lookup warning:', mErr.message);
      }
    }

    const UserModel = (req.tenantModels && req.tenantModels.User) || DefaultUser;
    
    // Find user in resolved workspace database
    let user = null;
    let isMatch = false;

    if (UserModel) {
      user = await UserModel.findOne({
        $or: [
          { email: inputEmail },
          { username: inputEmail },
          ...(req.tenant?.ownerEmail ? [{ email: req.tenant.ownerEmail.toLowerCase().trim() }] : []),
          ...(req.tenant?.ownerUsername ? [{ username: req.tenant.ownerUsername }] : [])
        ]
      }).select('+password');
    }

    if (user) {
      isMatch = await user.matchPassword(password);
    } else if (req.tenant && req.tenant.passwordHash) {
      const bcrypt = require('bcryptjs');
      isMatch = await bcrypt.compare(password, req.tenant.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let token;
    let userResponse;

    if (user) {
      token = user.getSignedJwtToken(req.tenantSlug);
      userResponse = user.toObject();
      delete userResponse.password;
    } else {
      const jwt = require('jsonwebtoken');
      token = jwt.sign(
        { id: req.tenant._id, tenantSlug: req.tenant.slug },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '1d' }
      );
      userResponse = {
        id: req.tenant._id,
        username: req.tenant.ownerUsername || req.tenant.ownerEmail,
        email: req.tenant.ownerEmail,
        role: 'staff'
      };
    }

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