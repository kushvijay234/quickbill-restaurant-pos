import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { CartItemRow } from '../../components/cart/CartItemRow';
import { CustomerInputForm } from '../../components/cart/CustomerInputForm';
import { PaymentModal } from '../../components/orders/PaymentModal';
import { ReceiptModal } from '../../components/orders/ReceiptModal';
import { Button } from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const CartCheckoutScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const {
    items,
    customer,
    currency,
    isTaxIncluded,
    taxRate,
    subtotal,
    tax,
    total,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomer,
    toggleTax,
  } = useCart();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const handleClear = () => {
    Alert.alert('Clear Cart', 'Remove all items from current order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        clearCart();
        navigation.goBack();
      }},
    ]);
  };

  const handleConfirmOrder = async (paymentMethod) => {
    if (items.length === 0) {
      Alert.alert('Empty Order', 'Please add items before saving');
      return;
    }

    try {
      setSavingOrder(true);
      const orderPayload = {
        customer: {
          name: customer.name.trim() === '' ? 'Cash' : customer.name.trim(),
          mobile: customer.mobile.trim(),
        },
        items: items.map((ci) => ({
          item: {
            id: String(ci.item?.id || ci.item?._id || ''),
            name: ci.item?.name || 'Item',
            imageUrl: ci.item?.imageUrl || '',
          },
          selectedVariant: {
            name: ci.selectedVariant?.name || 'Regular',
            price: Number(ci.selectedVariant?.price) || 0,
          },
          quantity: ci.quantity || 1,
        })),
        subtotal,
        tax,
        total,
        currency,
        paymentMethod,
      };

      const savedOrder = await orderService.createOrder(orderPayload);
      setShowPaymentModal(false);
      setCompletedOrder(savedOrder);
      setShowReceiptModal(true);
      clearCart();
    } catch (e) {
      Alert.alert('Order Failed', e.message || 'Could not complete order');
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <ScreenHeader
        title="Checkout & Order"
        onBack={() => navigation.goBack()}
        rightAction={
          items.length > 0 ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 14 }}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Information Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Details</Text>
          <CustomerInputForm customer={customer} onChange={setCustomer} />
        </View>

        {/* Order Items */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Items in Order</Text>
            <Text style={[styles.itemsCount, { color: colors.textMuted }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>

          {items.map((ci, idx) => (
            <CartItemRow
              key={`${ci.item.id}_${ci.selectedVariant.name}_${idx}`}
              item={ci.item}
              selectedVariant={ci.selectedVariant}
              quantity={ci.quantity}
              currency={currency}
              onIncrement={() =>
                updateQuantity(ci.item.id, ci.selectedVariant.name, ci.quantity + 1)
              }
              onDecrement={() =>
                updateQuantity(ci.item.id, ci.selectedVariant.name, ci.quantity - 1)
              }
              onRemove={() => removeItem(ci.item.id, ci.selectedVariant.name)}
            />
          ))}

          {items.length === 0 && (
            <View style={styles.emptyCartBox}>
              <Ionicons name="cart-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyCartText, { color: colors.textMuted }]}>
                Your order ticket is empty
              </Text>
              <Button
                title="Return to Menu"
                variant="outline"
                size="sm"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </View>

        {/* Financial Breakdown */}
        {items.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Billing Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryVal, { color: colors.text }]}>
                {formatCurrency(subtotal, currency)}
              </Text>
            </View>

            {/* Tax Switch Row */}
            <View style={styles.taxRow}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Apply Tax ({((taxRate || 0.05) * 100).toFixed(0)}%)
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>
                  {isTaxIncluded ? 'Added to bill' : 'Exempt / Zero tax'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={toggleTax}
                style={[
                  styles.taxSwitch,
                  { backgroundColor: isTaxIncluded ? COLORS.primary : colors.border },
                ]}
              >
                <View
                  style={[
                    styles.taxSwitchThumb,
                    isTaxIncluded && { transform: [{ translateX: 18 }] },
                  ]}
                />
              </TouchableOpacity>
            </View>

            {isTaxIncluded && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax Amount</Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {formatCurrency(tax, currency)}
                </Text>
              </View>
            )}

            <View style={[styles.divider, { borderTopColor: colors.border }]} />

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Net Payable</Text>
              <Text style={[styles.totalVal, { color: COLORS.primary }]}>
                {formatCurrency(total, currency)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Checkout Bottom Action */}
      {items.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            title={`Pay ${formatCurrency(total, currency)}`}
            onPress={() => setShowPaymentModal(true)}
            size="lg"
            icon={<Ionicons name="card-outline" size={20} color="#ffffff" />}
          />
        </View>
      )}

      {/* Modals */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        currency={currency}
        onConfirm={handleConfirmOrder}
        loading={savingOrder}
      />

      <ReceiptModal
        visible={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          navigation.goBack();
        }}
        order={completedOrder}
        profile={profile}
        onStartNewBill={() => {
          setShowReceiptModal(false);
          setCompletedOrder(null);
          clearCart();
          navigation.goBack();
        }}
      />
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
  clearBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 100,
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
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyCartText: {
    fontSize: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  taxSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  taxSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
});
