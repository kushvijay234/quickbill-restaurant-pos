import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../constants/currencies';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export const MenuItemCard = ({
  item,
  currency,
  onAddToCart,
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

        {/* Action Row - Only Add button */}
        <View style={styles.actionRow}>
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
    width: isTablet ? '31.3%' : '47.5%',
    margin: 4,
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
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    minHeight: 34,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 3,
  },
  actionRow: {
    marginTop: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
    width: '100%',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
