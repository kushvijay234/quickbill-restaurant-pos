import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { SubscriptionBanner } from '../../components/saas/SubscriptionBanner';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { MenuItemCard } from '../../menu/MenuItemCard';
import { MenuCategoryFilter } from '../../menu/MenuCategoryFilter';
import { VariantPickerModal } from '../../menu/VariantPickerModal';
import { AddMenuItemModal } from '../../menu/AddMenuItemModal';
import { EditMenuItemModal } from '../../menu/EditMenuItemModal';
import { CartItemRow } from '../../components/cart/CartItemRow';
import { CustomerInputForm } from '../../components/cart/CustomerInputForm';
import { PaymentModal } from '../../components/orders/PaymentModal';
import { ReceiptModal } from '../../components/orders/ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { menuService } from '../../services/menuService';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export const PosBillingScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, profile } = useAuth();
  const {
    items: cartItems,
    customer,
    currency,
    isTaxIncluded,
    taxRate,
    subtotal,
    tax,
    total,
    itemCount,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    setCustomer,
    toggleTax,
  } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [variantModalItem, setVariantModalItem] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await menuService.getMenu();
      const items = Array.isArray(data) ? data : data?.data || [];
      setMenuItems(items);
    } catch (e) {
      console.warn('Failed to load menu items:', e.message);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Derive categories from item names or standard tags
  const categories = useMemo(() => {
    const set = new Set(['All']);
    const items = Array.isArray(menuItems) ? menuItems : [];
    items.forEach((it) => {
      if (!it || !it.name) return;
      // Categorize by first word or keywords if category isn't explicit
      const name = String(it.name || '').toLowerCase();
      if (name.includes('pizza')) set.add('Pizzas');
      else if (name.includes('burger')) set.add('Burgers');
      else if (name.includes('dosa') || name.includes('idli')) set.add('South Indian');
      else if (name.includes('coffee') || name.includes('tea') || name.includes('shake'))
        set.add('Beverages');
      else if (name.includes('rice') || name.includes('biryani') || name.includes('curry'))
        set.add('Meals');
      else set.add('Specials');
    });
    return Array.from(set);
  }, [menuItems]);

  // Filtered menu items based on search and category
  const filteredItems = useMemo(() => {
    const items = Array.isArray(menuItems) ? menuItems : [];
    return items.filter((item) => {
      if (!item) return false;
      const itemName = String(item.name || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      const matchSearch =
        itemName.includes(query) ||
        (Array.isArray(item.variants) &&
          item.variants.some((v) =>
            String(v?.name || '').toLowerCase().includes(query)
          ));

      if (!matchSearch) return false;
      if (selectedCategory === 'All') return true;

      if (selectedCategory === 'Pizzas') return itemName.includes('pizza');
      if (selectedCategory === 'Burgers') return itemName.includes('burger');
      if (selectedCategory === 'South Indian')
        return itemName.includes('dosa') || itemName.includes('idli');
      if (selectedCategory === 'Beverages')
        return itemName.includes('coffee') || itemName.includes('tea') || itemName.includes('shake');
      if (selectedCategory === 'Meals')
        return itemName.includes('rice') || itemName.includes('biryani') || itemName.includes('curry');
      return true;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const handleCardAdd = (item) => {
    if (!item) return;
    const variants = Array.isArray(item.variants) ? item.variants : [];
    if (variants.length <= 1) {
      addToCart(item, variants[0] || { name: 'Regular', price: 0 });
    } else {
      setVariantModalItem(item);
    }
  };

  const handleAddItemSubmit = async (newItemData) => {
    const created = await menuService.addMenuItem(newItemData);
    if (created) {
      setMenuItems((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
    }
  };

  const handleUpdateItemSubmit = async (updatedItemData) => {
    const targetId = updatedItemData?.id || updatedItemData?._id;
    const updated = await menuService.updateMenuItem(targetId, updatedItemData);
    if (updated) {
      setMenuItems((prev) =>
        (Array.isArray(prev) ? prev : []).map((it) =>
          ((it?.id || it?._id) === (updated?.id || updated?._id) ? updated : it)
        )
      );
    }
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert('Delete Menu Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await menuService.deleteMenuItem(itemId);
            setMenuItems((prev) =>
              (Array.isArray(prev) ? prev : []).filter((it) => (it?.id || it?._id) !== itemId)
            );
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not delete item');
          }
        },
      },
    ]);
  };

  const handleConfirmOrder = async (paymentMethod) => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Order', 'Please add items to cart before proceeding');
      return;
    }

    try {
      setSavingOrder(true);
      const orderPayload = {
        customer: {
          name: customer.name.trim() === '' ? 'Cash' : customer.name.trim(),
          mobile: customer.mobile.trim(),
        },
        items: cartItems,
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
      Alert.alert('Order Failed', e.message || 'Could not submit order');
    } finally {
      setSavingOrder(false);
    }
  };

  const numColumns = isTablet ? 3 : 2;
  const canManageMenu = user?.role === 'admin';

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header with Side Menu trigger and Add Item button on top right */}
      <Header
        onAddItem={() => setShowAddItemModal(true)}
      />

      {/* Subscription notice if trialing */}
      <SubscriptionBanner onOpenSubscription={() => navigation.navigate('Subscription')} />

      <View style={[styles.mainLayout, isTablet && styles.tabletRow]}>
        {/* Left / Main Section: Menu Catalog */}
        <View style={[styles.catalogSection, isTablet && styles.tabletCatalog]}>
          {/* Top Search & Admin Actions */}
          <View style={styles.topControlRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Search food items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
                style={{ marginBottom: 0 }}
              />
            </View>

            {canManageMenu && (
              <TouchableOpacity
                onPress={() => setShowAddItemModal(true)}
                style={styles.addItemHeaderBtn}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.addItemHeaderBtnText}>New Item</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Horizontal Category Chips */}
          <MenuCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Items Grid */}
          <FlatList
            data={filteredItems}
            key={numColumns}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            keyExtractor={(item, index) => item?.id || item?._id || String(index)}
            renderItem={({ item }) => (
              <MenuItemCard
                item={item}
                currency={currency}
                onAddToCart={handleCardAdd}
                onEdit={(it) => setEditingItem(it)}
                onDelete={handleDeleteItem}
                canManage={true}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchMenu}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="fast-food-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No items found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                    Try changing your search query or add new items
                  </Text>
                </View>
              )
            }
          />
        </View>

        {/* Right Section: Tablet Permanent Order Ticket */}
        {isTablet && (
          <View
            style={[
              styles.tabletTicketSection,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.ticketHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.ticketTitleRow}>
                <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.ticketTitle, { color: colors.text }]}>Active Order</Text>
              </View>
              {cartItems.length > 0 && (
                <TouchableOpacity onPress={clearCart}>
                  <Text style={{ color: COLORS.danger, fontSize: 13, fontWeight: '700' }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Customer Inputs */}
            <CustomerInputForm customer={customer} onChange={setCustomer} />

            {/* Cart Items List */}
            <FlatList
              data={cartItems}
              keyExtractor={(it, idx) => `${it.item.id}_${it.selectedVariant.name}_${idx}`}
              renderItem={({ item: ci }) => (
                <CartItemRow
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
              )}
              style={styles.ticketItemsList}
              ListEmptyComponent={
                <View style={styles.emptyCartBox}>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    Cart is empty. Tap menu items to add.
                  </Text>
                </View>
              }
            />

            {/* Summary & Checkout */}
            <View style={[styles.ticketFooter, { borderTopColor: colors.border }]}>
              <View style={styles.taxToggleRow}>
                <Text style={[styles.taxLabel, { color: colors.textSecondary }]}>
                  Include Tax ({((taxRate || 0.05) * 100).toFixed(0)}%)
                </Text>
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

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Total:</Text>
                <Text style={[styles.totalVal, { color: COLORS.primary }]}>
                  {formatCurrency(total, currency)}
                </Text>
              </View>

              <Button
                title={`Pay ${formatCurrency(total, currency)}`}
                disabled={cartItems.length === 0}
                onPress={() => setShowPaymentModal(true)}
                size="lg"
              />
            </View>
          </View>
        )}
      </View>

      {/* Mobile Sticky Bottom Bar (when not tablet) */}
      {!isTablet && cartItems.length > 0 && (
        <View
          style={[
            styles.mobileBottomBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View>
            <Text style={[styles.barCount, { color: colors.textMuted }]}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={[styles.barTotal, { color: COLORS.primary }]}>
              {formatCurrency(total, currency)}
            </Text>
          </View>

          <Button
            title="View Order"
            size="md"
            onPress={() => navigation.navigate('CartCheckout')}
            icon={<Ionicons name="cart-outline" size={18} color="#ffffff" />}
          />
        </View>
      )}

      {/* Modals */}
      <VariantPickerModal
        visible={!!variantModalItem}
        onClose={() => setVariantModalItem(null)}
        item={variantModalItem}
        currency={currency}
        onSelectVariant={(it, v) => addToCart(it, v)}
      />

      <AddMenuItemModal
        visible={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItemSubmit}
      />

      <EditMenuItemModal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onUpdate={handleUpdateItemSubmit}
      />

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
        onClose={() => setShowReceiptModal(false)}
        order={completedOrder}
        profile={profile}
        onStartNewBill={() => {
          setCompletedOrder(null);
          clearCart();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
  },
  tabletRow: {
    flexDirection: 'row',
  },
  catalogSection: {
    flex: 1,
  },
  tabletCatalog: {
    flex: 0.62,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  addItemHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  addItemHeaderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 10,
    paddingBottom: 90,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 8,
    paddingHorizontal: 2,
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
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  tabletTicketSection: {
    flex: 0.38,
    borderLeftWidth: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  ticketItemsList: {
    flex: 1,
    marginVertical: 8,
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  ticketFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  taxToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 13,
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  mobileBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  barCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  barTotal: {
    fontSize: 20,
    fontWeight: '900',
  },
});
