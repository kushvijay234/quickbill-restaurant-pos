const mongoose = require('mongoose');

const PaymentTransactionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  tenantSlug: {
    type: String,
    required: true,
    index: true,
  },
  orderId: {
    type: String,
    required: true,
    index: true,
  },
  paymentId: {
    type: String,
    default: '',
  },
  planId: {
    type: String,
    required: true,
    default: 'starter',
  },
  planName: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'annual'],
    default: 'monthly',
  },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'pending', 'cancelled', 'failed'],
    default: 'pending',
    index: true,
  },
  failureReason: {
    type: String,
    default: '',
  },
  method: {
    type: String,
    default: 'razorpay',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  receiptUrl: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = PaymentTransactionSchema;
