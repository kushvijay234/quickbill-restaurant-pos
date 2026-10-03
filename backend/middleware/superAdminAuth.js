const jwt = require('jsonwebtoken');
const { getMasterModels } = require('../config/masterDb');

/**
 * Middleware to protect SaaS Platform SuperAdmin routes.
 * Strictly verifies JWT token and ensures user has the 'superadmin' role in Master DB.
 */
async function protectSuperAdmin(req, res, next) {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      message: 'Access denied. SuperAdmin token required.',
      code: 'SUPERADMIN_TOKEN_REQUIRED'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server security configuration error' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'superadmin') {
      return res.status(403).json({
        message: 'Forbidden. SuperAdmin privileges required.',
        code: 'NOT_SUPERADMIN'
      });
    }

    const { SuperAdmin } = getMasterModels();
    const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');

    if (!superAdmin) {
      return res.status(401).json({
        message: 'SuperAdmin account no longer exists.',
        code: 'SUPERADMIN_NOT_FOUND'
      });
    }

    req.superAdmin = superAdmin;
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired SuperAdmin token.',
      code: 'INVALID_TOKEN'
    });
  }
}

module.exports = {
  protectSuperAdmin
};
