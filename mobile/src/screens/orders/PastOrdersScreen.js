import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Input } from '../../components/common/Input';
import { OrderCard } from '../../components/orders/OrderCard';
import { ReceiptModal } from '../../components/orders/ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const PastOrdersScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const { currency } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | 'yesterday' | 'all'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(Array.isArray(data) ? data : data?.data || data?.orders || []);
    } catch (e) {
      console.warn('Failed to load past bills:', e.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    return list.filter((order) => {
      if (!order) return false;
      // Search matching
      const q = (searchQuery || '').toLowerCase();
      const orderId = String(order.id || order._id || '').toLowerCase();
      const custName = String(order.customer?.name || '').toLowerCase();
      const custMobile = String(order.customer?.mobile || '');

      const matchSearch =
        !q ||
        orderId.includes(q) ||
        custName.includes(q) ||
        custMobile.includes(q);

      if (!matchSearch) return false;

      // Date matching
      if (dateFilter === 'all') return true;
      const orderDate = new Date(order.date).toDateString();
      if (dateFilter === 'today') return orderDate === todayStr;
      if (dateFilter === 'yesterday') return orderDate === yesterdayStr;
      return true;
    });
  }, [orders, searchQuery, dateFilter]);

  // Aggregate metrics
  const { totalSales, totalCount } = useMemo(() => {
    const list = Array.isArray(filteredOrders) ? filteredOrders : [];
    const total = list.reduce((sum, o) => sum + (o?.total || 0), 0);
    return { totalSales: total, totalCount: list.length };
  }, [filteredOrders]);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Header />

      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchRow}>
          <Input
            placeholder="Search by customer, phone, or order #..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
            style={{ marginBottom: 0, flex: 1 }}
          />
        </View>

        {/* Date Filter Tabs */}
        <View style={styles.filterTabs}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
          ].map((tab) => {
            const isSelected = dateFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setDateFilter(tab.id)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isSelected
                      ? COLORS.primary
                      : isDark
                      ? colors.surface
                      : '#ffffff',
                    borderColor: isSelected ? COLORS.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color: isSelected ? '#ffffff' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Stats Summary Banner */}
        <View
          style={[
            styles.statsBanner,
            {
              backgroundColor: isDark ? colors.surface : '#ffffff',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Orders</Text>
            <Text style={[styles.statVal, { color: colors.text }]}>{totalCount}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Revenue</Text>
            <Text style={[styles.statVal, { color: COLORS.primary }]}>
              {formatCurrency(totalSales, currency)}
            </Text>
          </View>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item, index) => item?.id || item?._id || String(index)}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => setSelectedOrder(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchOrders}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Orders placed through POS will appear here
                </Text>
              </View>
            )
          }
        />
      </View>

      {/* Order Detail & Reprint Receipt Modal */}
      <ReceiptModal
        visible={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        profile={profile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabBtnText: {
    fontSize: 12,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    marginTop: 4,
  },
});
