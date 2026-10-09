const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  // Verify token strictly without fallback
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET not configured');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If tenantModels is not resolved yet, attempt to resolve via token claim
    if (!req.tenantModels && decoded.tenantSlug) {
      try {
        const { getTenantConnection } = require('../config/tenantManager');
        const { models, tenant } = await getTenantConnection(decoded.tenantSlug);
        req.tenantSlug = decoded.tenantSlug;
        req.tenant = tenant;
        req.tenantModels = models;
      } catch (tErr) {
        console.warn(`[Auth] Could not resolve tenant from token '${decoded.tenantSlug}':`, tErr.message);
      }
    }

    const UserModel = (req.tenantModels && req.tenantModels.User) || User;
    req.user = await UserModel.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User not found in tenant database' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized to access this route, token failed' });
  }
};



// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

// Optional protect: extracts user if token provided, but does not block if missing/invalid
exports.optionalProtect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || !process.env.JWT_SECRET) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!req.tenantModels && decoded.tenantSlug) {
      try {
        const { getTenantConnection } = require('../config/tenantManager');
        const { models, tenant } = await getTenantConnection(decoded.tenantSlug);
        req.tenantSlug = decoded.tenantSlug;
        req.tenant = tenant;
        req.tenantModels = models;
      } catch (tErr) {
        // ignore
      }
    }

    const UserModel = (req.tenantModels && req.tenantModels.User) || User;
    req.user = await UserModel.findById(decoded.id);
  } catch (err) {
    // ignore token errors for optional protection
  }
  next();
};