import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { profileService } from '../../services/profileService';
import { subscriptionService } from '../../services/subscriptionService';
import { CURRENCIES } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const RestaurantProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, profile, refreshProfile, tenantSlug } = useAuth();

  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxRatePercent, setTaxRatePercent] = useState('5');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR');
  const [saving, setSaving] = useState(false);
  const [subData, setSubData] = useState(null);

  const isAdmin = user?.role === 'admin';

  const loadSubData = useCallback(async () => {
    try {
      const data = await subscriptionService.getCurrentSubscription();
      if (data) setSubData(data);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadSubData();
  }, [loadSubData]);

  useEffect(() => {
    if (profile) {
      setRestaurantName(profile.restaurantName || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      const rate = typeof profile.taxRate === 'number' ? (profile.taxRate * 100).toString() : '5';
      setTaxRatePercent(rate);
      setSelectedCurrencyCode(profile.currency || 'INR');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Validation Error', 'Restaurant name is required');
      return;
    }

    const rateNum = parseFloat(taxRatePercent);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      Alert.alert('Validation Error', 'Please enter a valid tax percentage between 0 and 100');
      return;
    }

    const selectedCurrency = CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];

    try {
      setSaving(true);
      await profileService.updateProfile({
        restaurantName: restaurantName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        taxRate: rateNum / 100,
        currency: selectedCurrency.code,
        currencySymbol: selectedCurrency.symbol,
      });

      await refreshProfile();
      Alert.alert('Success', 'Profile settings saved successfully!');
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const planName = subData?.plan?.name || subData?.tenant?.activePlan?.toUpperCase() || 'STARTER';
  const daysLeft = subData?.daysRemaining;
  const planStatus = subData?.tenant?.status === 'active' ? 'Active' : 'Trial';

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ScreenHeader
        title="Settings & Account"
        showBack={navigation.canGoBack?.() || false}
        leftIcon="settings-outline"
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* PROMINENT PLAN & BILLING CARD */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Subscription')}
          style={[
            styles.planCard,
            {
              backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
              borderColor: isDark ? '#047857' : '#bbf7d0',
            },
          ]}
        >
          <View style={styles.planCardHeader}>
            <View style={styles.planCardTitleRow}>
              <View style={styles.planSparkleIcon}>
                <Ionicons name="sparkles" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.planSectionLabel}>PLAN & BILLING</Text>
                <Text style={[styles.planCardName, { color: isDark ? '#ffffff' : '#14532d' }]}>
                  {planName}
                </Text>
              </View>
            </View>
            <Badge label={planStatus} variant={planStatus === 'Active' ? 'success' : 'role'} size="sm" />
          </View>

          <Text style={[styles.planCardSubtitle, { color: isDark ? '#bbf7d0' : '#15803d' }]}>
            {typeof daysLeft === 'number'
              ? `${daysLeft} days remaining in trial • Tap to view plans or upgrade`
              : 'Tap to view subscription details, invoices, and quota limits'}
          </Text>

          <View style={styles.planActionRow}>
            <Text style={[styles.planActionText, { color: COLORS.primary }]}>
              Manage Plan & Billing
            </Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        {/* ADMIN SHORTCUTS */}
        {isAdmin && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Administration</Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('StaffManagement')}
              style={[styles.menuRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconWrap, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={[styles.menuRowTitle, { color: colors.text }]}>Staff & Cashiers</Text>
                  <Text style={[styles.menuRowSub, { color: colors.textMuted }]}>
                    Manage staff user accounts and permissions
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('AuditLogs')}
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconWrap, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="list-outline" size={18} color="#10b981" />
                </View>
                <View>
                  <Text style={[styles.menuRowTitle, { color: colors.text }]}>Security & Audit Logs</Text>
                  <Text style={[styles.menuRowSub, { color: colors.textMuted }]}>
                    View activity history and error events
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* GENERAL RESTAURANT PROFILE */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Restaurant Information</Text>

          <Input
            label="Restaurant Name *"
            placeholder="e.g. Cafe Delight"
            value={restaurantName}
            onChangeText={setRestaurantName}
            leftIcon={<Ionicons name="restaurant-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Address"
            placeholder="Street address, City, ZIP"
            value={address}
            onChangeText={setAddress}
            leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Contact Phone Number"
            placeholder="Phone printed on thermal receipts"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
          />
        </View>

        {/* LOGGED IN ACCOUNT / USER DETAILS */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Logged-in Account</Text>

          <View
            style={[
              styles.userAccountRow,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc',
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={[styles.accountUserName, { color: colors.text }]}>
                  {user?.username || user?.name || 'Staff Member'}
                </Text>
                {user?.role ? (
                  <Badge
                    label={user.role.toUpperCase()}
                    variant={user.role === 'admin' ? 'role' : 'info'}
                    size="sm"
                  />
                ) : null}
              </View>
              <Text style={[styles.accountUserEmail, { color: colors.textMuted }]}>
                {user?.email || 'Logged in'}
              </Text>
              {tenantSlug ? (
                <Text style={[styles.accountTenantSlug, { color: colors.textMuted }]}>
                  Restaurant ID: {tenantSlug}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* TAX & CURRENCY */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tax & Currency Settings</Text>

          <Input
            label="Default Sales Tax Rate (%)"
            placeholder="e.g. 5"
            value={taxRatePercent}
            onChangeText={setTaxRatePercent}
            keyboardType="numeric"
            leftIcon={<Ionicons name="calculator-outline" size={18} color={colors.textMuted} />}
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
            Default Currency
          </Text>

          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => {
              const isSelected = selectedCurrencyCode === curr.code;
              return (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => setSelectedCurrencyCode(curr.code)}
                  style={[
                    styles.currOption,
                    {
                      backgroundColor: isSelected
                        ? COLORS.primary
                        : isDark
                        ? colors.surfaceSubtle
                        : '#f8fafc',
                      borderColor: isSelected ? COLORS.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currSymbol,
                      { color: isSelected ? '#ffffff' : colors.text },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.currCode,
                      { color: isSelected ? '#ffffff' : colors.textMuted },
                    ]}
                  >
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Save Settings"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={styles.saveBtn}
        />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planSparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  planCardName: {
    fontSize: 18,
    fontWeight: '900',
  },
  planCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  planActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  planActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  currSymbol: {
    fontSize: 16,
    fontWeight: '900',
  },
  currCode: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 4,
  },
  userAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountUserName: {
    fontSize: 15,
    fontWeight: '800',
  },
  accountUserEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  accountTenantSlug: {
    fontSize: 11,
    marginTop: 2,
  },
});
