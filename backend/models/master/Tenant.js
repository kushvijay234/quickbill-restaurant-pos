const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: [true, 'Tenant slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  ownerUsername: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  ownerEmail: {
    type: String,
    required: [true, 'Owner email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please enter a valid email'
    ]
  },
  ownerPhone: {
    type: String,
    default: ''
  },
  dbName: {
    type: String,
    required: true,
    unique: true
  },
  customDomain: {
    type: String,
    default: null,
    sparse: true
  },
  status: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'suspended', 'cancelled'],
    default: 'trialing',
    index: true
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
  },
  activePlan: {
    type: String,
    enum: ['starter', 'pro', 'enterprise'],
    default: 'starter'
  },
  settings: {
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    taxRate: { type: Number, default: 0.05 },
    address: { type: String, default: '' },
    logoUrl: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = TenantSchema;
