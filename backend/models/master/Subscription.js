const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true,
    enum: ['starter', 'pro', 'enterprise'],
    default: 'starter'
  },
  status: {
    type: String,
    required: true,
    enum: ['trialing', 'active', 'past_due', 'cancelled', 'expired'],
    default: 'trialing'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  trialEndsAt: {
    type: Date
  },
  gracePeriodEndsAt: {
    type: Date
  },
  razorpaySubscriptionId: {
    type: String,
    default: ''
  },
  razorpayCustomerId: {
    type: String,
    default: ''
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  invoices: [{
    invoiceId: { type: String },
    amount: { type: Number },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['paid', 'failed', 'refunded'], default: 'paid' },
    razorpayPaymentId: { type: String },
    receiptUrl: { type: String }
  }]
}, {
  timestamps: true
});

module.exports = SubscriptionSchema;
