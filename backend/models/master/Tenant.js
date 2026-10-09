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
    required: [true, 'Business name is required'],
    maxlength: [69, 'Business name cannot exceed 69 characters'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    maxlength: [30, 'Owner name cannot exceed 30 characters'],
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
    index: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
      'Please enter a valid email'
    ]
  },
  ownerPhone: {
    type: String,
    default: '',
    index: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'Mobile number must be exactly 10 digits'
    }
  },
  passwordHash: {
    type: String,
    select: false
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
    enum: ['trialing', 'active', 'past_due', 'suspended', 'cancelled', 'expired'],
    default: 'trialing',
    index: true
  },
  trialEndsAt: {
    type: Date,
    default: () => {
      const trialDays = parseInt(process.env.TRIAL_PERIOD_DAYS, 10) || 3;
      return new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000); // 3 days trial
    }
  },
  dataPruned: {
    type: Boolean,
    default: false,
    index: true
  },
  dataPrunedAt: {
    type: Date,
    default: null
  },
  activePlan: {
    type: String,
    enum: ['starter', 'pro', 'professional', 'enterprise'],
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
