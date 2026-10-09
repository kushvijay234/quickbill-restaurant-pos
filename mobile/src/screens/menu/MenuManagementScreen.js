import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Input } from '../../components/common/Input';
import { EditMenuItemModal } from '../../menu/EditMenuItemModal';
import { AddMenuItemModal } from '../../menu/AddMenuItemModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { menuService } from '../../services/menuService';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export const MenuManagementScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const currency = profile?.currency || 'USD';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await menuService.getMenu({ limit: 200 });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching menu items:', err.message);
      Alert.alert('Error', 'Failed to load menu items. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtered menu items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter((it) => it?.name?.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Handle Edit Submit
  const handleUpdateItem = async (updatedData) => {
    const targetId = updatedData?.id || updatedData?._id;
    const updated = await menuService.updateMenuItem(targetId, updatedData);
    if (updated) {
      setItems((prev) =>
        prev.map((it) =>
          (it?.id || it?._id) === targetId ? { ...it, ...updated } : it
        )
      );
      Alert.alert('Success', `"${updated.name}" updated successfully!`);
    }
  };

  // Handle Delete Confirmation and API call
  const handleDeleteItem = (item) => {
    const itemId = item?.id || item?._id;
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(itemId);
              await menuService.deleteMenuItem(itemId);
              setItems((prev) => prev.filter((it) => (it?.id || it?._id) !== itemId));
              Alert.alert('Deleted', `"${item.name}" has been removed from the menu.`);
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete item');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Handle Add Item Submit
  const handleAddItem = async (newItemData) => {
    const created = await menuService.addMenuItem(newItemData);
    if (created) {
      setItems((prev) => [created, ...prev]);
      Alert.alert('Success', `"${created.name}" added to menu!`);
    }
  };

  // Render each row in the menu management table
  const renderItemRow = ({ item, index }) => {
    const itemId = item?.id || item?._id;
    const variants = item.variants || [];
    const isRowDeleting = actionLoadingId === itemId;

    return (
      <View
        style={[
          styles.tableRow,
          {
            backgroundColor: isDark
              ? index % 2 === 0
                ? colors.surface
                : colors.surfaceSubtle
              : index % 2 === 0
              ? '#ffffff'
              : '#f8fafc',
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Left Column: Item thumbnail & name */}
        <View style={styles.itemCol}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.thumbnailFallback,
                { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' },
              ]}
            >
              <Ionicons name="fast-food-outline" size={18} color={colors.textMuted} />
            </View>
          )}

          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            {variants.length > 0 && (
              <Text style={[styles.variantCount, { color: colors.textMuted }]}>
                {variants.length} {variants.length === 1 ? 'option' : 'options'}
              </Text>
            )}
          </View>
        </View>

        {/* Center Column: Pricing / Variants Breakdown */}
        <View style={styles.priceCol}>
          {variants.length === 1 ? (
            <Text style={[styles.singlePrice, { color: COLORS.primary }]}>
              {formatCurrency(variants[0].price, currency)}
            </Text>
          ) : variants.length > 1 ? (
            <View style={styles.variantsStack}>
              {variants.slice(0, 3).map((v, idx) => (
                <View key={idx} style={styles.variantPill}>
                  <Text style={[styles.variantPillName, { color: colors.textMuted }]} numberOfLines={1}>
                    {v.name}:
                  </Text>
                  <Text style={[styles.variantPillPrice, { color: colors.text }]}>
                    {formatCurrency(v.price, currency)}
                  </Text>
                </View>
              ))}
              {variants.length > 3 && (
                <Text style={{ fontSize: 10, color: colors.textMuted, fontStyle: 'italic' }}>
                  +{variants.length - 3} more
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>No price</Text>
          )}
        </View>

        {/* Right Column: Edit & Delete Action Icons */}
        <View style={styles.actionsCol}>
          {isRowDeleting ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <View style={styles.actionButtonsRow}>
              {/* Edit Icon Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditingItem(item)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                    borderColor: isDark ? '#334155' : '#dbeafe',
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="pencil" size={16} color={COLORS.accent} />
              </TouchableOpacity>

              {/* Delete Icon Button with Confirmation */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleDeleteItem(item)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: isDark ? '#450a0a' : '#fee2e2',
                    borderColor: isDark ? '#7f1d1d' : '#fecaca',
                  },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Screen Header */}
      <ScreenHeader
        title="Update Inventory"
        subtitle="Manage items, prices & options"
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowAddModal(true)}
            style={styles.headerAddBtn}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.headerAddBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* Search & Statistics Bar */}
      <View style={[styles.topControls, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
            rightIcon={
              searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null
            }
            style={{ marginBottom: 0 }}
          />
        </View>

        <View style={[styles.countBadge, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9', borderColor: colors.border }]}>
          <Text style={[styles.countBadgeText, { color: colors.text }]}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* Table Container */}
      <View style={styles.tableContainer}>
        {/* Table Header Row */}
        <View
          style={[
            styles.tableHeader,
            {
              backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9',
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.thText, styles.itemColTh, { color: colors.textMuted }]}>
            ITEM
          </Text>
          <Text style={[styles.thText, styles.priceColTh, { color: colors.textMuted }]}>
            PRICE / OPTIONS
          </Text>
          <Text style={[styles.thText, styles.actionsColTh, { color: colors.textMuted }]}>
            ACTIONS
          </Text>
        </View>

        {/* Table Rows FlatList */}
        {loading && items.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading menu catalog...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => item?.id || item?._id || String(index)}
            renderItem={renderItemRow}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchItems}
                colors={[COLORS.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="fast-food-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {searchQuery ? 'No matching items' : 'No items found'}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {searchQuery
                    ? 'Try searching with another keyword'
                    : 'Tap "+ Add Item" above to add your first item'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowAddModal(true)}
                  style={[styles.emptyAddBtn, { backgroundColor: COLORS.primary }]}
                >
                  <Ionicons name="add" size={18} color="#ffffff" />
                  <Text style={styles.emptyAddBtnText}>Add Menu Item</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Edit Menu Item Popup Modal */}
      <EditMenuItemModal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onUpdate={handleUpdateItem}
      />

      {/* Add Menu Item Popup Modal */}
      <AddMenuItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  headerAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  itemColTh: {
    flex: 1.5,
  },
  priceColTh: {
    flex: 1.1,
  },
  actionsColTh: {
    width: 84,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemCol: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  thumbnailFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  variantCount: {
    fontSize: 11,
    marginTop: 2,
  },
  priceCol: {
    flex: 1.1,
    paddingHorizontal: 4,
  },
  singlePrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  variantsStack: {
    gap: 2,
  },
  variantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  variantPillName: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 60,
  },
  variantPillPrice: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsCol: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
