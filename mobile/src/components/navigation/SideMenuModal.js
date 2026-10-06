import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/subscriptionService';
import { Badge } from '../common/Badge';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.82, 340);

export const SideMenuModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, profile, tenantSlug, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [subData, setSubData] = useState(null);

  useEffect(() => {
    if (visible) {
      subscriptionService.getCurrentSubscription().then((data) => {
        setSubData(data);
      });
    }
  }, [visible]);

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24)
    : insets.top;

  const isAdmin = user?.role === 'admin';
  const displayName = profile?.restaurantName || 'RESTOBILL';
  const daysRemaining = subData?.daysRemaining;
  const planStatus = subData?.tenant?.status === 'active' ? 'Active' : 'Trial';

  const handleNav = (screenName, tabName) => {
    onClose();
    if (tabName) {
      navigation.navigate('MainTabs', { screen: tabName });
    } else {
      navigation.navigate(screenName);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your POS session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          onClose();
          logout();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sidebar Drawer */}
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.surface,
              paddingTop: Math.max(topInset, 16) + 6,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons name="restaurant" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.brandTitle, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {tenantSlug ? (
                  <Text style={[styles.slugText, { color: colors.textMuted }]} numberOfLines={1}>
                    {tenantSlug}
                  </Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Navigation Links ScrollView */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Main Navigation Section */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>NAVIGATION</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNav(null, 'Menu')}
              style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="restaurant-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Menu & POS Billing</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNav(null, 'Orders')}
              style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="receipt-outline" size={18} color={COLORS.accent} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Past Orders</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNav('MenuManagement')}
              style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="fast-food-outline" size={18} color="#d97706" />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Update Menu</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {isAdmin && (
              <>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleNav(null, 'Admin')}
                  style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: '#f5f3ff' }]}>
                    <Ionicons name="speedometer-outline" size={18} color="#7c3aed" />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Admin Dashboard</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleNav('StaffManagement')}
                  style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: '#e0e7ff' }]}>
                    <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Staff Accounts</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleNav('AuditLogs')}
                  style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
                >
                  <View style={[styles.menuIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="document-text-outline" size={18} color="#d97706" />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Audit & Event Logs</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}

            {/* Account & Settings Section */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 18 }]}>
              ACCOUNT & BILLING
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNav('Settings')}
              style={[styles.menuItem, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Restaurant Settings</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNav('Subscription')}
              style={[styles.menuItem, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#4338ca' }]}>
                <Ionicons name="sparkles" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuItemText, { color: isDark ? '#ffffff' : '#312e81', fontWeight: '800' }]}>
                  Plan & Subscription
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#c7d2fe' : '#4338ca' }}>
                  {typeof daysRemaining === 'number'
                    ? `${daysRemaining} days left in ${planStatus}`
                    : 'Manage billing & upgrades'}
                </Text>
              </View>
              <Badge
                label={planStatus}
                variant={planStatus === 'Active' ? 'success' : 'role'}
                size="sm"
              />
            </TouchableOpacity>

            {/* Preferences Section */}
            <Text style={[styles.sectionHeading, { color: colors.textMuted, marginTop: 18 }]}>
              PREFERENCES
            </Text>

            {/* Dark Mode Row */}
            <View
              style={[
                styles.menuItem,
                { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc', justifyContent: 'space-between' },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.menuIconWrap, { backgroundColor: isDark ? '#374151' : '#f1f5f9' }]}>
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={18}
                    color={isDark ? '#f59e0b' : '#ea580c'}
                  />
                </View>
                <View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>
                    {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                thumbColor={isDark ? COLORS.primary : '#f4f3f4'}
                trackColor={{ false: '#cbd5e1', true: 'rgba(5, 150, 105, 0.4)' }}
              />
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogoutPress}
              style={[styles.logoutBtn, { marginTop: 24 }]}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>

            {/* RESTOBILL Branding Footer */}
            <View style={styles.brandingFooter}>
              <View style={styles.brandRowInline}>
                <Text style={[styles.brandMainTitle, { color: colors.text }]}>
                  RESTO<Text style={{ color: COLORS.primary }}>BILL</Text>
                </Text>
                <Text style={[styles.brandBullet, { color: colors.textMuted }]}>•</Text>
                <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
                  Bill. Serve. Grow.
                </Text>
              </View>

              <View style={styles.poweredByContainer}>
                <Text style={[styles.poweredByPrefix, { color: colors.textMuted }]}>
                  Powered by{' '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://vjenterprisesdigitalsolutions.com/')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.poweredByCompany, { color: COLORS.primary }]}>
                    VJ ENTERPRISES DIGITAL SOLUTIONS
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.mottoText, { color: colors.textMuted }]}>
                • "Grow Digitally, Grow Confidently"
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawer: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  slugText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
  },
  logoutBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  brandingFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    gap: 5,
  },
  brandRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandMainTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  brandBullet: {
    fontSize: 11,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '600',
  },
  poweredByContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  poweredByPrefix: {
    fontSize: 10,
    fontWeight: '500',
  },
  poweredByCompany: {
    fontSize: 10,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  mottoText: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '500',
    textAlign: 'center',
  },
});
