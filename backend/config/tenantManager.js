const mongoose = require('mongoose');
const { buildDbUri } = require('../utils/dbUri');
const { connectMasterDB } = require('./masterDb');
const { getTenantModels } = require('../models/tenantModels');

// Map of tenantSlug -> { connection, models, tenant, lastAccessed }
const connectionPool = new Map();

// Idle timeout (30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Resolves or establishes an isolated database connection for the requested tenant.
 * @param {string} tenantSlug - Unique tenant identifier (e.g. 'cafe-delight')
 * @returns {Promise<{ connection: mongoose.Connection, models: Object, tenant: Object }>}
 */
async function getTenantConnection(tenantSlug) {
  if (!tenantSlug || typeof tenantSlug !== 'string') {
    throw new Error('Valid tenant slug is required');
  }

  const normalizedSlug = tenantSlug.toLowerCase().trim();

  // 1. Check existing cached connection in memory
  if (connectionPool.has(normalizedSlug)) {
    const entry = connectionPool.get(normalizedSlug);
    if (entry.connection && entry.connection.readyState === 1) {
      entry.lastAccessed = Date.now();
      return entry;
    } else {
      // Stale or disconnected, remove from map
      try {
        await entry.connection.close();
      } catch (err) {
        // ignore close error
      }
      connectionPool.delete(normalizedSlug);
    }
  }

  // 2. Fetch tenant metadata from Master DB
  const { masterModels } = await connectMasterDB();
  const tenant = await masterModels.Tenant.findOne({ slug: normalizedSlug });

  if (!tenant) {
    const error = new Error(`Tenant '${normalizedSlug}' not found`);
    error.statusCode = 404;
    error.code = 'TENANT_NOT_FOUND';
    throw error;
  }

  // 3. Construct isolated database URI for this tenant
  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const tenantDbName = tenant.dbName || `quickbill_tenant_${normalizedSlug.replace(/[^a-z0-9_]/g, '_')}`;
  const tenantDbUri = buildDbUri(baseUri, tenantDbName);

  // 4. Create isolated Mongoose connection
  const connection = mongoose.createConnection(tenantDbUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000
  });

  await connection.asPromise();

  // Handle connection events
  connection.on('error', (err) => {
    console.error(`[Tenant DB Error: ${normalizedSlug}]:`, err.message);
  });

  connection.on('disconnected', () => {
    console.warn(`[Tenant DB Disconnected: ${normalizedSlug}]`);
    connectionPool.delete(normalizedSlug);
  });

  // 5. Instantiate isolated models for this tenant
  const models = getTenantModels(connection);

  const entry = {
    connection,
    models,
    tenant,
    lastAccessed: Date.now()
  };

  connectionPool.set(normalizedSlug, entry);
  console.log(`[Tenant Pool] Connected to isolated DB: ${tenantDbName} for tenant: ${normalizedSlug}`);

  return entry;
}

/**
 * Manually close a tenant connection
 */
async function closeTenantConnection(tenantSlug) {
  const normalizedSlug = tenantSlug.toLowerCase().trim();
  if (connectionPool.has(normalizedSlug)) {
    const entry = connectionPool.get(normalizedSlug);
    connectionPool.delete(normalizedSlug);
    if (entry.connection && entry.connection.readyState !== 0) {
      await entry.connection.close();
      console.log(`[Tenant Pool] Closed connection for tenant: ${normalizedSlug}`);
    }
  }
}

/**
 * Periodic idle connection cleanup to prevent MongoDB connection exhaustion
 */
const cleanupInterval = setInterval(async () => {
  const now = Date.now();
  for (const [slug, entry] of connectionPool.entries()) {
    if (now - entry.lastAccessed > IDLE_TIMEOUT_MS) {
      console.log(`[Tenant Pool] Evicting idle connection for tenant: ${slug}`);
      try {
        await entry.connection.close();
      } catch (err) {
        console.error(`Error closing idle connection for ${slug}:`, err.message);
      }
      connectionPool.delete(slug);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Unref timer so it doesn't block process exit
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Close all active tenant connections (for graceful server shutdown)
 */
async function closeAllTenantConnections() {
  for (const [slug, entry] of connectionPool.entries()) {
    try {
      if (entry.connection) {
        await entry.connection.close();
      }
    } catch (err) {
      // ignore
    }
  }
  connectionPool.clear();
}

module.exports = {
  getTenantConnection,
  closeTenantConnection,
  closeAllTenantConnections,
  getActivePoolSize: () => connectionPool.size
};
