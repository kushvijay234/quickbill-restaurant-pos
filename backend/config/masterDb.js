const mongoose = require('mongoose');
const { buildDbUri } = require('../utils/dbUri');
const TenantSchema = require('../models/master/Tenant');
const PlanSchema = require('../models/master/Plan');
const SubscriptionSchema = require('../models/master/Subscription');
const SuperAdminSchema = require('../models/master/SuperAdmin');
const PaymentTransactionSchema = require('../models/master/PaymentTransaction');

let masterConnection = null;
let masterModels = null;

const DEFAULT_PLANS = [
  {
    planId: 'starter',
    name: 'Starter Tier',
    description: 'Perfect for small cafes and food kiosks starting out',
    priceInr: 999,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 3,
      maxMenuItems: 50,
      maxOrdersPerMonth: 500,
      tableManagement: false,
      analytics: false,
      prioritySupport: false,
      customBranding: false
    }
  },
  {
    planId: 'pro',
    name: 'Professional Business',
    description: 'Ideal for busy restaurants needing full table & order analytics',
    priceInr: 2499,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 15,
      maxMenuItems: 500,
      maxOrdersPerMonth: -1, // Unlimited
      tableManagement: true,
      analytics: true,
      prioritySupport: true,
      customBranding: false
    }
  },
  {
    planId: 'enterprise',
    name: 'Enterprise Multi-Chain',
    description: 'For restaurant chains, franchise groups, and high-volume dining',
    priceInr: 5999,
    billingPeriod: 'monthly',
    features: {
      maxStaff: 100,
      maxMenuItems: 5000,
      maxOrdersPerMonth: -1, // Unlimited
      tableManagement: true,
      analytics: true,
      prioritySupport: true,
      customBranding: true
    }
  }
];

const connectMasterDB = async () => {
  if (masterConnection && masterConnection.readyState === 1) {
    return { masterConnection, masterModels };
  }

  const baseUri = process.env.MONGO_URI;
  if (!baseUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  const masterUri = buildDbUri(baseUri, 'quickbill_master');

  try {
    masterConnection = mongoose.createConnection(masterUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000
    });

    await masterConnection.asPromise();
    console.log(` Master Database connected: quickbill_master`);

    // Register Master models on master connection
    masterModels = {
      Tenant: masterConnection.model('Tenant', TenantSchema),
      Plan: masterConnection.model('Plan', PlanSchema),
      Subscription: masterConnection.model('Subscription', SubscriptionSchema),
      SuperAdmin: masterConnection.model('SuperAdmin', SuperAdminSchema),
      PaymentTransaction: masterConnection.model('PaymentTransaction', PaymentTransactionSchema)
    };

    // Seed default plans if not already present
    await seedDefaultPlans(masterModels.Plan);

    // Seed default Platform SuperAdmin if not already present
    await seedDefaultSuperAdmin(masterModels.SuperAdmin);

    return { masterConnection, masterModels };
  } catch (error) {
    console.error(' Master DB connection error:', error.message);
    throw error;
  }
};

const seedDefaultPlans = async (PlanModel) => {
  try {
    for (const planData of DEFAULT_PLANS) {
      await PlanModel.findOneAndUpdate(
        { planId: planData.planId },
        { $setOnInsert: planData },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error('Failed to seed default SaaS plans:', err.message);
  }
};

const seedDefaultSuperAdmin = async (SuperAdminModel) => {
  try {
    const rawEmail = process.env.SUPERADMIN_EMAIL;
    const rawUsername = process.env.SUPERADMIN_USERNAME;
    const password = process.env.SUPERADMIN_PASSWORD;

    if (!rawEmail || !rawUsername || !password) {
      console.warn('[Master DB] Notice: SUPERADMIN_EMAIL, SUPERADMIN_USERNAME, or SUPERADMIN_PASSWORD not set in environment. Skipping SuperAdmin seeding.');
      return;
    }

    const email = rawEmail.toLowerCase().trim();
    const username = rawUsername.trim();

    let existing = await SuperAdminModel.findOne({
      $or: [
        { email },
        { username }
      ]
    }).select('+password');

    if (!existing) {
      await SuperAdminModel.create({
        username,
        email,
        password,
        role: 'superadmin'
      });
      console.log(`[Master DB] Seeded Platform SuperAdmin from env: ${email}`);
    } else {
      existing.email = email;
      existing.username = username;
      existing.password = password;
      await existing.save();
      console.log(`[Master DB] Synced Platform SuperAdmin from env: ${email}`);
    }
  } catch (err) {
    console.warn('[Master DB] Notice: SuperAdmin seeding skipped:', err.message);
  }
};

const getMasterModels = () => {
  if (!masterModels) {
    throw new Error('Master DB not initialized. Call connectMasterDB() first.');
  }
  return masterModels;
};

const getMasterConnection = () => {
  if (!masterConnection) {
    throw new Error('Master DB not initialized. Call connectMasterDB() first.');
  }
  return masterConnection;
};

module.exports = {
  connectMasterDB,
  getMasterModels,
  getMasterConnection,
  DEFAULT_PLANS
};
