import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const CartItemRow = ({ item, selectedVariant, quantity, currency, onIncrement, onDecrement, onRemove }) => {
  const { colors, isDark } = useTheme();

  const unitPrice = selectedVariant?.price || 0;
  const lineTotal = unitPrice * quantity;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceSubtle : '#ffffff',
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.detailsCol}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.variantText, { color: colors.textMuted }]}>
          {selectedVariant?.name || 'Standard'} • {formatCurrency(unitPrice, currency)}
        </Text>
      </View>

      {/* Stepper */}
      <View style={styles.actionCol}>
        <View style={[styles.stepper, { backgroundColor: isDark ? colors.surface : '#f1f5f9' }]}>
          <TouchableOpacity
            onPress={onDecrement}
            style={styles.stepBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={quantity === 1 ? 'trash-outline' : 'remove'}
              size={16}
              color={quantity === 1 ? COLORS.danger : colors.text}
            />
          </TouchableOpacity>

          <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>

          <TouchableOpacity
            onPress={onIncrement}
            style={styles.stepBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.lineTotal, { color: colors.text }]}>
          {formatCurrency(lineTotal, currency)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  detailsCol: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  variantText: {
    fontSize: 12,
    marginTop: 2,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepBtn: {
    padding: 6,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 64,
    textAlign: 'right',
  },
});
