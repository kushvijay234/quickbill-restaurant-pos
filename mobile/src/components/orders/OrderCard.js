import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../constants/currencies';
import { Badge } from '../common/Badge';
import { COLORS } from '../../constants/colors';

export const OrderCard = ({ order, onPress }) => {
  const { colors, isDark } = useTheme();

  const formattedDate = order.date
    ? new Date(order.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const totalItems = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
  const orderId = order.id ? order.id.slice(-6).toUpperCase() : '';

  const getMethodBadge = () => {
    switch (order.paymentMethod?.toLowerCase()) {
      case 'upi':
        return { label: 'UPI', variant: 'role' };
      case 'card':
        return { label: 'CARD', variant: 'info' };
      default:
        return { label: 'CASH', variant: 'success' };
    }
  };

  const badgeInfo = getMethodBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : '#ffffff',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.idGroup}>
          <Text style={[styles.orderNumber, { color: colors.text }]}>#{orderId}</Text>
          <Badge label={badgeInfo.label} variant={badgeInfo.variant} size="sm" />
        </View>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>{formattedDate}</Text>
      </View>

      <View style={styles.midRow}>
        <View>
          <Text style={[styles.customerName, { color: colors.textSecondary }]}>
            {order.customer?.name || 'Walk-in Customer'}
          </Text>
          {order.customer?.mobile ? (
            <Text style={[styles.customerMobile, { color: colors.textMuted }]}>
              {order.customer.mobile}
            </Text>
          ) : null}
        </View>

        <Text style={[styles.totalAmount, { color: COLORS.primary }]}>
          {formatCurrency(order.total, order.currency)}
        </Text>
      </View>

      <View style={[styles.bottomRow, { borderTopColor: colors.border }]}>
        <View style={styles.itemCountGroup}>
          <Ionicons name="fast-food-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.itemCountText, { color: colors.textMuted }]}>
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.viewDetailAction}>
          <Text style={[styles.viewText, { color: COLORS.accent }]}>View Bill</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 12,
  },
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerMobile: {
    fontSize: 12,
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  bottomRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCountText: {
    fontSize: 12,
  },
  viewDetailAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
