import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ModalContainer } from '../../components/common/ModalContainer';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/subscriptionService';
import { storageService } from '../../services/storageService';
import { getApiBaseUrl } from '../../services/api';
import { COLORS } from '../../constants/colors';

const DEFAULT_PLANS_FALLBACK = [
  {
    planId: 'starter',
    name: 'Starter Essential',
    description: 'Perfect for small cafes and food kiosks starting out',
    priceInr: 999,
    features: {
      maxStaff: 3,
      maxMenuItems: 50,
      maxOrdersPerMonth: 500,
    },
  },
  {
    planId: 'pro',
    name: 'Professional Business',
    description: 'Ideal for busy restaurants needing full table & order analytics',
    priceInr: 2499,
    features: {
      maxStaff: 15,
      maxMenuItems: 500,
      maxOrdersPerMonth: 'Unlimited',
    },
  },
  {
    planId: 'enterprise',
    name: 'Enterprise Multi-Chain',
    description: 'For restaurant chains, franchise groups, and high-volume dining',
    priceInr: 5999,
    features: {
      maxStaff: 100,
      maxMenuItems: 5000,
      maxOrdersPerMonth: 'Unlimited',
    },
  },
];

export const SubscriptionScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS_FALLBACK);
  const [loading, setLoading] = useState(false);

  // Upgrade & Payment Modal State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'gateway_opened'

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const [current, allPlans] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getPlans(),
      ]);
      setSubData(current);
      const plansList = Array.isArray(allPlans)
        ? allPlans
        : allPlans?.plans || allPlans?.data || [];
      if (plansList.length > 0) {
        setPlans(plansList);
      }
    } catch (e) {
      console.warn('Subscription fetch warning:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const tenant = subData?.tenant;
  const currentPlan = subData?.plan;
  const daysRemaining = subData?.daysRemaining;

  const calculatePlanPrice = (plan, cycle) => {
    if (!plan) return 0;
    if (cycle === 'yearly') {
      return Math.round(plan.priceInr * 12 * 0.8); // 20% annual discount
    }
    return plan.priceInr;
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setBillingCycle('monthly');
    setPaymentStep('select');
  };

  // 1. Launch Razorpay Gateway via backend order
  const handlePayWithRazorpay = async () => {
    if (!selectedPlan) return;
    try {
      setIsProcessing(true);
      const orderRes = await subscriptionService.createOrder({
        planId: selectedPlan.planId,
        billingCycle,
      });

      if (!orderRes || !orderRes.orderId) {
        throw new Error(orderRes?.message || 'Could not initiate payment order');
      }

      const token = await storageService.getToken();
      const tenantSlug = await storageService.getTenantSlug();
      const apiBase = getApiBaseUrl().replace(/\/api\/?$/, '');

      const checkoutUrl = `${apiBase}/api/subscription/checkout-page?orderId=${encodeURIComponent(
        orderRes.orderId
      )}&keyId=${encodeURIComponent(orderRes.keyId || '')}&amount=${orderRes.amount}&planId=${encodeURIComponent(
        selectedPlan.planId
      )}&planName=${encodeURIComponent(selectedPlan.name)}&tenantSlug=${encodeURIComponent(
        tenantSlug || ''
      )}&token=${encodeURIComponent(token || '')}&billingCycle=${billingCycle}`;

      await Linking.openURL(checkoutUrl);
      setPaymentStep('gateway_opened');
    } catch (err) {
      Alert.alert('Payment Error', err.message || 'Failed to initiate Razorpay checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Check and sync payment status after returning from gateway
  const handleCheckPaymentStatus = async () => {
    try {
      setIsProcessing(true);
      const current = await subscriptionService.getCurrentSubscription();
      if (
        current?.tenant?.activePlan === selectedPlan?.planId ||
        current?.tenant?.status === 'active'
      ) {
        setSubData(current);
        setSelectedPlan(null);
        setPaymentStep('select');
        Alert.alert(
          '🎉 Subscription Active!',
          `Your restaurant is now active on the ${selectedPlan?.name || 'selected'} plan!`
        );
      } else {
        Alert.alert(
          'Payment Status',
          'Payment verification is pending on the server. If you completed payment, please wait a moment and tap verify again, or tap instant test activation below.'
        );
      }
    } catch (err) {
      Alert.alert('Status Check Error', err.message || 'Could not check subscription status');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Instant developer sandbox test activation
  const handleInstantDevActivation = async () => {
    if (!selectedPlan) return;
    try {
      setIsProcessing(true);
      const orderRes = await subscriptionService.createOrder({
        planId: selectedPlan.planId,
        billingCycle,
      });

      const verifyRes = await subscriptionService.verifyPayment({
        razorpay_order_id: orderRes.orderId || `order_mock_${Date.now()}`,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        planId: selectedPlan.planId,
        billingCycle,
      });

      await fetchSubscription();
      setSelectedPlan(null);
      setPaymentStep('select');
      Alert.alert(
        '🚀 Plan Upgraded Successfully!',
        verifyRes.message || `Your account has been upgraded to ${selectedPlan.name}!`
      );
    } catch (err) {
      Alert.alert('Upgrade Error', err.message || 'Failed to complete test activation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title="Plan & Billing"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchSubscription}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Active Plan Card */}
        <View
          style={[
            styles.activePlanCard,
            {
              backgroundColor: isDark ? colors.surface : '#ffffff',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.planTopRow}>
            <View>
              <Text style={[styles.planLabel, { color: colors.textMuted }]}>CURRENT PLAN</Text>
              <Text style={[styles.planName, { color: colors.text }]}>
                {currentPlan?.name || tenant?.activePlan?.toUpperCase() || 'STARTER'}
              </Text>
            </View>
            <Badge
              label={tenant?.status || 'TRIAL'}
              variant={tenant?.status === 'active' ? 'success' : 'warning'}
              size="md"
            />
          </View>

          {typeof daysRemaining === 'number' && (
            <View style={[styles.daysBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.daysText, { color: colors.text }]}>
                <Text style={{ fontWeight: '800', color: COLORS.primary }}>
                  {daysRemaining} days remaining
                </Text>{' '}
                in current cycle
              </Text>
            </View>
          )}

          {/* Current Feature Limits */}
          {currentPlan?.features && (
            <View style={styles.featuresList}>
              <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>
                Plan Quotas & Features:
              </Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Up to {currentPlan.features.maxStaff} Staff Members
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Up to {currentPlan.features.maxMenuItems} Menu Items
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Up to {currentPlan.features.maxOrdersPerMonth} Orders / Month
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Available Plans */}
        {plans.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Plans</Text>

            {plans.map((p) => {
              const isCurrent =
                (currentPlan?.planId || tenant?.activePlan) === p.planId;
              return (
                <View
                  key={p.planId}
                  style={[
                    styles.planOptionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isCurrent ? COLORS.primary : colors.border,
                      borderWidth: isCurrent ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.planOptionTop}>
                    <View>
                      <Text style={[styles.planOptionName, { color: colors.text }]}>{p.name}</Text>
                      <Text style={[styles.planPrice, { color: COLORS.primary }]}>
                        ₹{p.priceInr}
                        <Text style={{ fontSize: 13, color: colors.textMuted }}>/month</Text>
                      </Text>
                    </View>
                    {isCurrent ? (
                      <Badge label="Current Plan" variant="success" size="sm" />
                    ) : null}
                  </View>

                  <Text style={[styles.planDesc, { color: colors.textMuted }]}>
                    {p.description}
                  </Text>

                  {!isCurrent && (
                    <Button
                      title={`Upgrade to ${p.name}`}
                      variant="outline"
                      size="sm"
                      onPress={() => handleUpgrade(p)}
                      style={{ marginTop: 12 }}
                    />
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Razorpay Subscription Checkout Modal */}
      {selectedPlan && (
        <ModalContainer
          visible={!!selectedPlan}
          onClose={() => {
            if (!isProcessing) {
              setSelectedPlan(null);
              setPaymentStep('select');
            }
          }}
          title="Upgrade Plan"
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            {/* Plan Header */}
            <View
              style={[
                styles.modalPlanHeader,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.modalPlanIcon}>
                <Ionicons name="sparkles" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalPlanTitle, { color: colors.text }]}>
                  {selectedPlan.name}
                </Text>
                <Text style={[styles.modalPlanDesc, { color: colors.textMuted }]}>
                  {selectedPlan.description}
                </Text>
              </View>
            </View>

            {/* Billing Cycle Selector */}
            <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Billing Cycle</Text>
            <View style={styles.cycleRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setBillingCycle('monthly')}
                style={[
                  styles.cycleBtn,
                  {
                    borderColor: billingCycle === 'monthly' ? COLORS.primary : colors.border,
                    backgroundColor:
                      billingCycle === 'monthly'
                        ? isDark
                          ? 'rgba(5, 150, 105, 0.15)'
                          : '#ecfdf5'
                        : isDark
                        ? colors.surfaceSubtle
                        : '#ffffff',
                  },
                ]}
              >
                <View style={styles.cycleBtnHeader}>
                  <Text style={[styles.cycleBtnTitle, { color: colors.text }]}>Monthly</Text>
                  {billingCycle === 'monthly' && (
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                  )}
                </View>
                <Text style={[styles.cycleBtnPrice, { color: COLORS.primary }]}>
                  ₹{selectedPlan.priceInr}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>/mo</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setBillingCycle('yearly')}
                style={[
                  styles.cycleBtn,
                  {
                    borderColor: billingCycle === 'yearly' ? COLORS.primary : colors.border,
                    backgroundColor:
                      billingCycle === 'yearly'
                        ? isDark
                          ? 'rgba(5, 150, 105, 0.15)'
                          : '#ecfdf5'
                        : isDark
                        ? colors.surfaceSubtle
                        : '#ffffff',
                  },
                ]}
              >
                <View style={styles.cycleBtnHeader}>
                  <Text style={[styles.cycleBtnTitle, { color: colors.text }]}>Yearly</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>Save 20%</Text>
                  </View>
                </View>
                <Text style={[styles.cycleBtnPrice, { color: COLORS.primary }]}>
                  ₹{calculatePlanPrice(selectedPlan, 'yearly')}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>/yr</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Features preview */}
            {selectedPlan.features && (
              <View
                style={[
                  styles.modalFeaturesBox,
                  {
                    backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.modalFeaturesTitle, { color: colors.textMuted }]}>
                  INCLUDED QUOTAS
                </Text>
                <View style={styles.modalFeatureRow}>
                  <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.modalFeatureText, { color: colors.text }]}>
                    Up to {selectedPlan.features.maxStaff} Staff Accounts
                  </Text>
                </View>
                <View style={styles.modalFeatureRow}>
                  <Ionicons name="restaurant-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.modalFeatureText, { color: colors.text }]}>
                    Up to {selectedPlan.features.maxMenuItems} Menu Items
                  </Text>
                </View>
                <View style={styles.modalFeatureRow}>
                  <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.modalFeatureText, { color: colors.text }]}>
                    {selectedPlan.features.maxOrdersPerMonth === 'Unlimited'
                      ? 'Unlimited Orders'
                      : `Up to ${selectedPlan.features.maxOrdersPerMonth} Orders / Month`}
                  </Text>
                </View>
              </View>
            )}

            {/* Total Price Row */}
            <View
              style={[
                styles.priceSummaryRow,
                { borderTopColor: colors.border, borderBottomColor: colors.border },
              ]}
            >
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Payable</Text>
                <Text style={[styles.summaryCycle, { color: colors.textSecondary }]}>
                  {billingCycle === 'yearly' ? 'Annual Subscription' : 'Monthly Subscription'}
                </Text>
              </View>
              <Text style={[styles.summaryAmount, { color: COLORS.primary }]}>
                ₹{calculatePlanPrice(selectedPlan, billingCycle)}
              </Text>
            </View>

            {/* Gateway status notice */}
            {paymentStep === 'gateway_opened' && (
              <View style={styles.gatewayNotice}>
                <Ionicons name="information-circle" size={20} color="#0284c7" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.gatewayNoticeTitle}>Razorpay Gateway Opened</Text>
                  <Text style={styles.gatewayNoticeDesc}>
                    Complete your payment in the browser, then tap "Verify Payment" below.
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {paymentStep === 'gateway_opened' ? (
                <>
                  <Button
                    title="Verify Payment & Activate"
                    onPress={handleCheckPaymentStatus}
                    loading={isProcessing}
                    size="lg"
                    icon={<Ionicons name="checkmark-done" size={18} color="#ffffff" />}
                  />
                  <TouchableOpacity
                    onPress={handlePayWithRazorpay}
                    disabled={isProcessing}
                    style={[styles.secondaryActionBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      Re-open Razorpay Checkout
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Button
                    title={`Pay ₹${calculatePlanPrice(selectedPlan, billingCycle)} with Razorpay`}
                    onPress={handlePayWithRazorpay}
                    loading={isProcessing}
                    size="lg"
                    icon={<Ionicons name="card-outline" size={18} color="#ffffff" />}
                  />
                  <TouchableOpacity
                    onPress={handleInstantDevActivation}
                    disabled={isProcessing}
                    style={[
                      styles.instantTestBtn,
                      {
                        borderColor: '#c7d2fe',
                        backgroundColor: isDark ? '#1e1b4b' : '#eef2ff',
                      },
                    ]}
                  >
                    <Ionicons name="flash" size={16} color="#4338ca" />
                    <Text style={styles.instantTestBtnText}>
                      Instant Test Activation (Dev Sandbox)
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Security Footer */}
            <View style={styles.securityFooter}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={[styles.securityText, { color: colors.textMuted }]}>
                Secured by Razorpay • UPI, Cards, NetBanking
              </Text>
            </View>
          </ScrollView>
        </ModalContainer>
      )}
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  activePlanCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  daysBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  daysText: {
    fontSize: 13,
  },
  featuresList: {
    gap: 8,
    marginTop: 4,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  planOptionCard: {
    borderRadius: 16,
    padding: 18,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  planOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planOptionName: {
    fontSize: 17,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  planDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  // Modal styles
  modalContent: {
    gap: 14,
  },
  modalPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  modalPlanIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlanTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalPlanDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  cycleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cycleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  cycleBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cycleBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  cycleBtnPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  discountBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  modalFeaturesBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  modalFeaturesTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modalFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalFeatureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryCycle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '900',
  },
  gatewayNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  gatewayNoticeTitle: {
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '700',
  },
  gatewayNoticeDesc: {
    color: '#0284c7',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  actionSection: {
    gap: 10,
    marginTop: 6,
  },
  secondaryActionBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  instantTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  instantTestBtnText: {
    color: '#4338ca',
    fontSize: 13,
    fontWeight: '700',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
