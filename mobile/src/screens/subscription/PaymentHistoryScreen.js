import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../context/ThemeContext';
import { subscriptionService } from '../../services/subscriptionService';
import { COLORS } from '../../constants/colors';

export const PaymentHistoryScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'paid' | 'cancelled' | 'failed'

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subscriptionService.getPaymentHistory();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to load payment history:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  // Calculate summary counts
  const paidCount = transactions.filter((t) => t.status === 'paid').length;
  const cancelledCount = transactions.filter((t) => t.status === 'cancelled').length;
  const failedCount = transactions.filter((t) => t.status === 'failed').length;
  const totalPaidAmount = transactions
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return {
          label: 'PAID',
          variant: 'success',
          icon: 'checkmark-circle',
          color: '#059669',
          bg: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
        };
      case 'cancelled':
        return {
          label: 'CANCELLED',
          variant: 'warning',
          icon: 'close-circle',
          color: '#d97706',
          bg: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fffbeb',
        };
      case 'failed':
        return {
          label: 'FAILED',
          variant: 'danger',
          icon: 'alert-circle',
          color: '#dc2626',
          bg: isDark ? 'rgba(220, 38, 38, 0.2)' : '#fef2f2',
        };
      default:
        return {
          label: status ? status.toUpperCase() : 'PENDING',
          variant: 'neutral',
          icon: 'time',
          color: '#64748b',
          bg: isDark ? 'rgba(100, 116, 139, 0.2)' : '#f1f5f9',
        };
    }
  };

  const renderItem = ({ item }) => {
    const badgeInfo = getStatusBadge(item.status);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.surface : '#ffffff',
            borderColor: colors.border,
          },
        ]}
      >
        {/* Top Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.planInfo}>
            <Text style={[styles.planTitle, { color: colors.text }]}>
              {item.planName || (item.planId ? item.planId.toUpperCase() : 'SaaS Plan')}
            </Text>
            <Text style={[styles.cycleBadge, { color: colors.textSecondary }]}>
              {item.billingCycle === 'yearly' ? 'Annual Cycle' : 'Monthly Cycle'}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: badgeInfo.bg }]}>
            <Ionicons name={badgeInfo.icon} size={14} color={badgeInfo.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusPillText, { color: badgeInfo.color }]}>{badgeInfo.label}</Text>
          </View>
        </View>

        {/* Amount & Date Row */}
        <View style={styles.amountRow}>
          <View>
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>AMOUNT</Text>
            <Text style={[styles.amountValue, { color: badgeInfo.color }]}>
              ₹{Number(item.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>DATE & TIME</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(item.date)}</Text>
          </View>
        </View>

        {/* Order Details & IDs */}
        <View style={[styles.metaSection, { borderTopColor: colors.border }]}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Order ID:</Text>
            <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
              {item.orderId || 'N/A'}
            </Text>
          </View>
          {item.paymentId ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Payment ID:</Text>
              <Text style={[styles.metaValue, { color: colors.text }]} numberOfLines={1}>
                {item.paymentId}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Cancellation or Failure Reason Notice */}
        {item.failureReason ? (
          <View
            style={[
              styles.reasonBox,
              {
                backgroundColor: item.status === 'cancelled'
                  ? isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb'
                  : isDark ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2',
                borderColor: item.status === 'cancelled'
                  ? isDark ? '#b45309' : '#fde68a'
                  : isDark ? '#b91c1c' : '#fecaca',
              },
            ]}
          >
            <Ionicons
              name={item.status === 'cancelled' ? 'information-circle' : 'alert-circle'}
              size={16}
              color={item.status === 'cancelled' ? '#d97706' : '#dc2626'}
              style={{ marginRight: 6, marginTop: 1 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.reasonTitle,
                  { color: item.status === 'cancelled' ? '#b45309' : '#b91c1c' },
                ]}
              >
                {item.status === 'cancelled' ? 'Cancellation Note:' : 'Issue Details:'}
              </Text>
              <Text
                style={[
                  styles.reasonText,
                  { color: item.status === 'cancelled' ? '#92400e' : '#991b1b' },
                ]}
              >
                {item.failureReason}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Payment History" onBack={() => navigation.goBack()} />

      {/* Summary Cards Header */}
      <View style={styles.summaryContainer}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: isDark ? colors.surface : '#ffffff', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>TOTAL PAID</Text>
          <Text style={[styles.summaryCardValue, { color: COLORS.primary }]}>
            ₹{totalPaidAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.summaryCardSub, { color: colors.textSecondary }]}>
            {paidCount} Successful
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: isDark ? colors.surface : '#ffffff', borderColor: colors.border },
          ]}
        >
          <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>ATTEMPTS</Text>
          <Text style={[styles.summaryCardValue, { color: colors.text }]}>
            {transactions.length} Total
          </Text>
          <Text style={[styles.summaryCardSub, { color: '#d97706' }]}>
            {cancelledCount + failedCount} Cancelled/Failed
          </Text>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        {[
          { key: 'all', label: `All (${transactions.length})` },
          { key: 'paid', label: `Paid (${paidCount})` },
          { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
          { key: 'failed', label: `Failed (${failedCount})` },
        ].map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.8}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? COLORS.primary
                    : isDark
                    ? colors.surfaceSubtle
                    : '#ffffff',
                  borderColor: isActive ? COLORS.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isActive ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions List */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading payment records...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item, index) => item.orderId || item._id || String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchHistory}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}>
                <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {filter === 'all'
                  ? 'No subscription payment attempts recorded yet.'
                  : `No ${filter} payment attempts recorded.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 4,
  },
  summaryCardSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
    marginRight: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cycleBadge: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  metaSection: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    maxWidth: '70%',
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  reasonTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  reasonText: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default PaymentHistoryScreen;
