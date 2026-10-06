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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/subscriptionService';
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

  const handleUpgrade = (plan) => {
    Alert.alert(
      'Upgrade Plan',
      `To upgrade to ${plan.name} (₹${plan.priceInr}/mo), please contact your account manager or complete checkout in the QuickBill portal.`,
      [{ text: 'OK' }]
    );
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
});
