import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { adminService } from '../../services/adminService';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const AdminDashboardScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { currency } = useCart();
  const [stats, setStats] = useState({
    userCount: 0,
    orderCount: 0,
    menuCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.warn('Failed to load admin stats:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue || 0, currency),
      icon: 'cash-outline',
      color: COLORS.primary,
      bg: isDark ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5',
    },
    {
      title: 'Total Orders',
      value: stats.orderCount || 0,
      icon: 'receipt-outline',
      color: COLORS.accent,
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
    },
    {
      title: 'Menu Items',
      value: stats.menuCount || 0,
      icon: 'restaurant-outline',
      color: '#f59e0b',
      bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
    },
    {
      title: 'Active Staff',
      value: stats.userCount || 0,
      icon: 'people-outline',
      color: '#8b5cf6',
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
    },
  ];

  const adminShortcuts = [
    {
      title: 'Staff Management',
      desc: 'Add cashiers, reset passwords, assign roles',
      icon: 'people',
      screen: 'StaffManagement',
      color: '#8b5cf6',
    },
    {
      title: 'Audit Logs',
      desc: 'View staff logins, order events, and system errors',
      icon: 'document-text',
      screen: 'AuditLogs',
      color: '#0284c7',
    },
    {
      title: 'Restaurant Profile',
      desc: 'Update address, tax percentage, and currency',
      icon: 'business',
      screen: 'Profile',
      color: COLORS.primary,
    },
    {
      title: 'SaaS Plan & Subscription',
      desc: 'View active limits, trial status, and renewals',
      icon: 'sparkles',
      screen: 'Subscription',
      color: '#f59e0b',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header onOpenProfile={() => navigation.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchStats} colors={[COLORS.primary]} />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Performance Overview</Text>

        {/* 2x2 Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {cards.map((card, idx) => (
            <View
              key={idx}
              style={[
                styles.metricCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon} size={22} color={card.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>{card.value}</Text>
              <Text style={[styles.metricTitle, { color: colors.textMuted }]}>{card.title}</Text>
            </View>
          ))}
        </View>

        {/* Administration Modules */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
          Restaurant Management
        </Text>

        <View style={styles.shortcutsList}>
          {adminShortcuts.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen)}
              style={[
                styles.shortcutCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.shortcutIconWrap, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <View style={styles.shortcutContent}>
                <Text style={[styles.shortcutTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.shortcutDesc, { color: colors.textMuted }]}>{item.desc}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  shortcutsList: {
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  shortcutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  shortcutDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
