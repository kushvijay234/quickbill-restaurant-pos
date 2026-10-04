import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../constants/currencies';
import { COLORS } from '../constants/colors';

export const MenuItemCard = ({
  item,
  currency,
  onAddToCart,
  onEdit,
  onDelete,
  canManage = false,
}) => {
  const { colors, isDark } = useTheme();

  const variants = item.variants || [];
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0;
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price)) : 0;

  const priceLabel =
    minPrice === maxPrice
      ? formatCurrency(minPrice, currency)
      : `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`;

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
      {/* Item Image with Fallback */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.imageFallback, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}>
            <Ionicons name="fast-food-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {/* Variant count badge */}
        {variants.length > 1 && (
          <View style={styles.variantBadge}>
            <Text style={styles.variantBadgeText}>{variants.length} options</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={[styles.price, { color: COLORS.primary }]}>{priceLabel}</Text>

        {/* Action Row */}
        <View style={styles.actionRow}>
          {canManage && (
            <View style={styles.manageIcons}>
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={[styles.smallIconBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}
              >
                <Ionicons name="pencil" size={14} color={COLORS.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(item.id || item._id)}
                style={[styles.smallIconBtn, { backgroundColor: '#fee2e2' }]}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onAddToCart(item)}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    height: 110,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  variantBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    minHeight: 36,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 6,
  },
  manageIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  smallIconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 2,
    marginLeft: 'auto',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
