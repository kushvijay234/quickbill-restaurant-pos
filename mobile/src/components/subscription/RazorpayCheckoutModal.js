import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/subscriptionService';
import { COLORS } from '../../constants/colors';

const generateRazorpayCheckoutHtml = ({
  keyId,
  amount,
  planName,
  orderId,
  billingCycle,
  tenantSlug = '',
}) => {
  const isRealOrder = orderId && orderId.startsWith('order_') && !orderId.startsWith('order_mock_');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .container {
      width: 100%;
      max-width: 400px;
      text-align: center;
      padding: 24px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #e2e8f0;
      border-top-color: #059669;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }
    .btn {
      display: none;
      margin-top: 20px;
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="loader"></div>
    <div class="title" id="titleText">Opening Razorpay Checkout...</div>
    <div class="subtitle" id="subText">Please wait while the official Razorpay payment screen loads.</div>
    <button class="btn" id="retryBtn" onclick="launchCheckout()">Tap to Re-open Razorpay</button>
  </div>

  <script>
    function notify(type, data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
      }
    }

    var rzpInstance = null;

    function launchCheckout() {
      var options = {
        key: "${keyId || 'rzp_test_TjIML0KJ4VAkFn'}",
        amount: ${amount || 99900},
        currency: "INR",
        name: "QuickBill Restaurant POS",
        description: "${planName} (${billingCycle})",
        image: "https://cdn.razorpay.com/static/assets/logo/rzp.png",
        theme: { color: "#059669" },
        prefill: {
          name: "${tenantSlug || 'Restaurant Admin'}",
          email: "billing@quickbill.com",
          contact: "9876543210"
        },
        handler: function(response) {
          notify('PAYMENT_SUCCESS', response);
        },
        modal: {
          confirm_close: true,
          ondismiss: function() {
            notify('PAYMENT_CANCELLED', { orderId: "${orderId}" });
            document.getElementById('loader').style.display = 'none';
            document.getElementById('titleText').innerText = 'Payment Cancelled';
            document.getElementById('subText').innerText = 'You closed the payment window. Tap below if you wish to retry.';
            document.getElementById('retryBtn').style.display = 'block';
          }
        }
      };

      ${isRealOrder ? `options.order_id = "${orderId}";` : ''}

      try {
        rzpInstance = new Razorpay(options);
        rzpInstance.on('payment.failed', function(resp) {
          var desc = (resp.error && resp.error.description) ? resp.error.description : 'Payment failed';
          notify('PAYMENT_FAILED', { error: desc, orderId: "${orderId}", paymentId: (resp.error && resp.error.metadata) ? resp.error.metadata.payment_id : '' });
          document.getElementById('loader').style.display = 'none';
          document.getElementById('titleText').innerText = 'Payment Unsuccessful';
          document.getElementById('subText').innerText = desc;
          document.getElementById('retryBtn').style.display = 'block';
        });
        rzpInstance.open();
        notify('CHECKOUT_PAGE_LOADED', {});
      } catch (err) {
        notify('PAYMENT_FAILED', { error: err.message, orderId: "${orderId}" });
        document.getElementById('loader').style.display = 'none';
        document.getElementById('titleText').innerText = 'Could not load Razorpay';
        document.getElementById('subText').innerText = err.message;
        document.getElementById('retryBtn').style.display = 'block';
      }
    }

    window.onload = function() {
      setTimeout(launchCheckout, 100);
    };
  </script>
</body>
</html>`;
};

export const RazorpayCheckoutModal = ({
  visible,
  onClose,
  plan,
  billingCycle = 'monthly',
  orderData,
  checkoutUrl,
  onSuccess,
  onError,
}) => {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationText, setVerificationText] = useState('Verifying payment with server...');

  const handleCloseAttempt = () => {
    if (isVerifying) return; // Cannot close during active verification

    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel the checkout process? Your card or account will not be charged.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            subscriptionService.recordPaymentEvent({
              orderId: orderData?.orderId,
              planId: plan?.planId,
              billingCycle,
              status: 'cancelled',
              reason: 'Payment cancelled by user',
            });
            setIsLoading(true);
            setIsVerifying(false);
            if (onClose) onClose();
          },
        },
      ]
    );
  };

  const handleMessage = async (event) => {
    try {
      const raw = event.nativeEvent.data;
      if (!raw) return;

      const message = JSON.parse(raw);
      const { type, data, error } = message;

      if (type === 'CHECKOUT_PAGE_LOADED') {
        setIsLoading(false);
      } else if (type === 'PAYMENT_SUCCESS') {
        setIsVerifying(true);
        setVerificationText('Payment received! Activating your subscription plan...');

        // Verify signature with backend
        try {
          const verifyRes = await subscriptionService.verifyPayment({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            planId: plan?.planId,
            billingCycle,
          });

          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setIsVerifying(false);

          if (onSuccess) {
            onSuccess(verifyRes);
          }
        } catch (vErr) {
          setIsVerifying(false);
          const errorMsg = vErr.message || 'Payment signature verification failed';
          Alert.alert('Verification Failed', errorMsg);
          if (onError) onError(errorMsg);
        }
      } else if (type === 'SUBSCRIPTION_ACTIVATED') {
        // Backend verification completed via webview fetch
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setIsVerifying(false);
        if (onSuccess) {
          onSuccess(data);
        }
      } else if (type === 'PAYMENT_CANCELLED') {
        subscriptionService.recordPaymentEvent({
          orderId: orderData?.orderId || data?.orderId,
          planId: plan?.planId,
          billingCycle,
          status: 'cancelled',
          reason: 'User closed payment window',
        });
        if (onClose) onClose();
      } else if (type === 'PAYMENT_FAILED') {
        setIsVerifying(false);
        const errMsg = error || 'Payment could not be completed';
        subscriptionService.recordPaymentEvent({
          orderId: orderData?.orderId || data?.orderId,
          paymentId: data?.paymentId || '',
          planId: plan?.planId,
          billingCycle,
          status: 'failed',
          reason: errMsg,
        });
        Alert.alert('Payment Unsuccessful', errMsg);
        if (onError) onError(errMsg);
      }
    } catch (err) {
      console.warn('[RazorpayCheckoutModal] parse error:', err.message);
    }
  };

  const handleShouldStartLoad = (request) => {
    const { url } = request;

    // Check for UPI and other custom app scheme intents
    const isCustomScheme =
      url.startsWith('upi://') ||
      url.startsWith('phonepe://') ||
      url.startsWith('paytmmp://') ||
      url.startsWith('tez://') ||
      url.startsWith('gpay://') ||
      url.startsWith('intent://') ||
      url.startsWith('credpay://') ||
      url.startsWith('bhim://');

    if (isCustomScheme) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            Alert.alert('App Not Found', 'Requested payment app is not installed on this device.');
          }
        })
        .catch((err) => {
          console.warn('[UPI Intent Open Error]:', err.message);
        });
      return false; // Don't let WebView load custom scheme as web URL
    }

    // Allow standard HTTP/HTTPS navigation (Razorpay iframe, bank 3D secure pages, etc.)
    return true;
  };

  const formattedAmount = orderData?.amount
    ? (Number(orderData.amount) / 100).toLocaleString('en-IN')
    : plan?.priceInr?.toLocaleString('en-IN') || '0';

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleCloseAttempt}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? colors.surface : '#ffffff' }]} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
          <TouchableOpacity
            onPress={handleCloseAttempt}
            disabled={isVerifying}
            style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.titleRow}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                Razorpay Checkout
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {plan?.name || 'SaaS'} Plan • ₹{formattedAmount} ({billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})
            </Text>
          </View>

          <View style={styles.securityBadge}>
            <Text style={styles.securityBadgeText}>256-BIT SSL</Text>
          </View>
        </View>

        {/* WebView Container */}
        <View style={styles.webViewWrapper}>
          <WebView
            ref={webViewRef}
            source={{
              html: generateRazorpayCheckoutHtml({
                keyId: orderData?.keyId || 'rzp_test_TjIML0KJ4VAkFn',
                amount: orderData?.amount || (plan?.priceInr ? (billingCycle === 'yearly' ? Math.round(plan.priceInr * 12 * 0.8 * 100) : plan.priceInr * 100) : 99900),
                planName: plan?.name || 'SaaS Plan',
                orderId: orderData?.orderId || '',
                billingCycle,
              }),
              baseUrl: 'https://checkout.razorpay.com',
            }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="always"
            allowsInlineMediaPlayback={true}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadEnd={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false);
              console.warn('WebView Load Error:', e.nativeEvent);
            }}
          />

          {/* Initial Loading Indicator */}
          {isLoading && !isVerifying && (
            <View style={[styles.loadingOverlay, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Opening Secure Razorpay Payment...
              </Text>
              <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
                Enter Card, UPI or Netbanking details inside
              </Text>
            </View>
          )}

          {/* Payment Verification Spinner Overlay */}
          {isVerifying && (
            <View style={styles.verifyingOverlay}>
              <View style={[styles.verifyingBox, { backgroundColor: isDark ? colors.surface : '#ffffff' }]}>
                <View style={styles.pulseIconContainer}>
                  <Ionicons name="sync" size={32} color={COLORS.primary} />
                </View>
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12, marginBottom: 8 }} />
                <Text style={[styles.verifyingTitle, { color: colors.text }]}>Activating Subscription</Text>
                <Text style={[styles.verifyingText, { color: colors.textSecondary }]}>{verificationText}</Text>
                <Text style={[styles.verifyingSubtext, { color: colors.textMuted }]}>
                  Please do not close or minimize the application.
                </Text>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  securityBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  verifyingBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  verifyingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  verifyingSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
