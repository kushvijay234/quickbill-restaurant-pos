import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalContainer } from '../components/common/ModalContainer';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../constants/currencies';
import { COLORS } from '../constants/colors';

export const VariantPickerModal = ({ visible, onClose, item, currency, onSelectVariant }) => {
  const { colors, isDark } = useTheme();

  if (!item) return null;

  const variants = item.variants || [];

  return (
    <ModalContainer visible={visible} onClose={onClose} title={`Select Option: ${item.name}`}>
      <View style={styles.container}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Choose size or portion to add to order:
        </Text>

        <View style={styles.list}>
          {variants.map((variant, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => {
                onSelectVariant(item, variant);
                onClose();
              }}
              style={[
                styles.variantItem,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc',
                  borderColor: colors.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.variantName, { color: colors.text }]}>{variant.name}</Text>
                <Text style={[styles.variantPrice, { color: COLORS.primary }]}>
                  {formatCurrency(variant.price, currency)}
                </Text>
              </View>

              <View style={styles.addCircle}>
                <Ionicons name="add" size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  subtitle: {
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  variantName: {
    fontSize: 15,
    fontWeight: '700',
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
