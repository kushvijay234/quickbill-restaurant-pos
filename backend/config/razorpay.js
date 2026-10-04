const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';

try {
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
} catch (err) {
  console.warn('[Razorpay] Initialization warning:', err.message);
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Verify Razorpay webhook signature
 * @param {string|Buffer} rawBody 
 * @param {string} signature 
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = {
  razorpayInstance,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getKeyId: () => process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key'
};
