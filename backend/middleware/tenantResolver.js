const jwt = require('jsonwebtoken');
const { getTenantConnection } = require('../config/tenantManager');

/**
 * Extracts the tenant slug from multiple possible request contexts:
 * 1. Explicit Header: X-Tenant-ID
 * 2. Query param: ?tenant=... (useful in dev/testing)
 * 3. Subdomain: <slug>.domain.com or <slug>.localhost
 * 4. JWT token: payload.tenantSlug
 */
function extractTenantSlug(req) {
  // 1. Header (case-insensitive in Express)
  if (req.headers['x-tenant-id'] && typeof req.headers['x-tenant-id'] === 'string') {
    const headerSlug = req.headers['x-tenant-id'].trim().toLowerCase();
    if (headerSlug) return headerSlug;
  }

  // 2. Query parameter
  if (req.query && req.query.tenant && typeof req.query.tenant === 'string') {
    const querySlug = req.query.tenant.trim().toLowerCase();
    if (querySlug) return querySlug;
  }

  // 3. Subdomain extraction
  const host = req.headers.host || req.hostname || '';
  const hostWithoutPort = host.split(':')[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort);
  if (!isIp) {
    const parts = hostWithoutPort.split('.');
    if (parts.length > 2) {
      const subdomain = parts[0].toLowerCase();
      // Exclude reserved platform subdomains and cloud hosting providers (e.g. onrender.com, vercel.app)
      const reserved = ['www', 'api', 'admin', 'app', 'localhost', 'quickbill-restaurant-pos'];
      const isReserved =
        reserved.includes(subdomain) ||
        subdomain.startsWith('quickbill') ||
        hostWithoutPort.endsWith('.onrender.com') ||
        hostWithoutPort.endsWith('.vercel.app');

      if (!isReserved) {
        return subdomain;
      }
    }
  }

  // 4. JWT Token fallback inspection
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.tenantSlug) {
        return decoded.tenantSlug.toLowerCase();
      }
    } catch (e) {
      // ignore decode error, will be handled by auth middleware
    }
  }

  // 5. Default fallback for local dev if configured
  if (process.env.DEFAULT_TENANT_SLUG) {
    return process.env.DEFAULT_TENANT_SLUG.toLowerCase();
  }

  return null;
}

/**
 * Middleware that resolves tenant context, loads the isolated database connection,
 * and attaches req.tenant, req.tenantConnection, and req.tenantModels.
 * 
 * @param {Object} options - { optional: boolean }
 */
function resolveTenant(options = { optional: false }) {
  return async (req, res, next) => {
    try {
      const tenantSlug = extractTenantSlug(req);

      if (!tenantSlug) {
        if (options.optional) {
          return next();
        }
        return res.status(400).json({
          message: 'Tenant identifier missing. Provide X-Tenant-ID header, ?tenant= query, or subdomain.',
          code: 'TENANT_HEADER_REQUIRED'
        });
      }

      // Fetch or establish connection to this tenant's isolated DB
      const { connection, models, tenant } = await getTenantConnection(tenantSlug);

      req.tenantSlug = tenantSlug;
      req.tenant = tenant;
      req.tenantConnection = connection;
      req.tenantModels = models;

      next();
    } catch (err) {
      if (err.code === 'TENANT_NOT_FOUND') {
        if (options.optional) {
          return next();
        }
        return res.status(404).json({
          message: `Restaurant instance '${req.headers['x-tenant-id'] || 'unknown'}' not found. Please verify your restaurant URL or register a new account.`,
          code: 'TENANT_NOT_FOUND'
        });
      }

      console.error('[TenantResolver Error]:', err.message);
      return res.status(500).json({
        message: 'Database routing error while resolving restaurant database',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  };
}

module.exports = {
  resolveTenant,
  extractTenantSlug
};
