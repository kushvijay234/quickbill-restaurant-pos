const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
    unique: true,
    enum: ['starter', 'pro', 'enterprise']
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priceInr: {
    type: Number,
    required: true
  },
  billingPeriod: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  razorpayPlanId: {
    type: String,
    default: ''
  },
  features: {
    maxStaff: { type: Number, default: 3 },
    maxMenuItems: { type: Number, default: 50 },
    maxOrdersPerMonth: { type: Number, default: 500 }, // -1 for unlimited
    tableManagement: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = PlanSchema;
