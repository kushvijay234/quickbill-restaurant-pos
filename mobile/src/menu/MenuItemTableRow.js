import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../constants/currencies';
import { COLORS } from '../constants/colors';

export const MenuItemTableRow = ({
  item,
  currency,
  onAddToCart,
  inCartCount = 0,
}) => {
  const { colors, isDark } = useTheme();

  const variants = Array.isArray(item.variants) ? item.variants : [];
  const minPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : 0;
  const maxPrice = variants.length > 0 ? Math.max(...variants.map((v) => v.price)) : 0;

  const priceLabel =
    minPrice === maxPrice
      ? formatCurrency(minPrice, currency)
      : `${formatCurrency(minPrice, currency)} - ${formatCurrency(maxPrice, currency)}`;

  const hasMultipleVariants = variants.length > 1;

  return (
    <View
      style={[
        styles.tableRow,
        {
          backgroundColor: isDark ? colors.surface : '#ffffff',
          borderColor: inCartCount > 0 ? 'rgba(5, 150, 105, 0.4)' : colors.border,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Left: Thumbnail & Item info */}
      <View style={styles.itemInfoCol}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View
            style={[
              styles.thumbnailFallback,
              { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' },
            ]}
          >
            <Ionicons name="fast-food-outline" size={20} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {inCartCount > 0 && (
              <View style={styles.inCartPill}>
                <Text style={styles.inCartPillText}>{inCartCount} in cart</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            {hasMultipleVariants ? (
              <View style={[styles.variantBadge, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}>
                <Ionicons name="layers-outline" size={11} color={colors.textMuted} />
                <Text style={[styles.variantBadgeText, { color: colors.textMuted }]}>
                  {variants.length} options
                </Text>
              </View>
            ) : variants[0]?.name && variants[0]?.name !== 'Regular' ? (
              <Text style={[styles.singleVariantName, { color: colors.textMuted }]} numberOfLines={1}>
                {variants[0].name}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Middle: Price Column */}
      <View style={styles.priceCol}>
        <Text style={[styles.itemPrice, { color: COLORS.primary }]} numberOfLines={1}>
          {priceLabel}
        </Text>
      </View>

      {/* Right: Add Action Button */}
      <View style={styles.actionCol}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAddToCart(item)}
          style={[
            styles.addBtn,
            hasMultipleVariants && styles.optionsBtn,
          ]}
        >
          <Ionicons
            name={hasMultipleVariants ? 'options-outline' : 'add'}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.addBtnText}>
            {hasMultipleVariants ? 'Options' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: 10,
    marginVertical: 3,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemInfoCol: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  thumbnailFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  inCartPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  inCartPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  variantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  variantBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  singleVariantName: {
    fontSize: 11,
  },
  priceCol: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 68,
  },
  optionsBtn: {
    backgroundColor: '#059669',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
