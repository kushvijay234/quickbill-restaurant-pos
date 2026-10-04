import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const PaymentModal = ({ visible, onClose, total, currency, onConfirm, loading }) => {
  const { colors, isDark } = useTheme();
  const [selectedMethod, setSelectedMethod] = useState('cash'); // 'cash' | 'upi' | 'card'
  const [cashTendered, setCashTendered] = useState('');

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = tenderedNum > total ? tenderedNum - total : 0;

  const handleConfirm = () => {
    onConfirm(selectedMethod);
  };

  const methods = [
    { id: 'cash', label: 'Cash', icon: 'cash-outline', color: COLORS.cash },
    { id: 'upi', label: 'UPI / QR', icon: 'qr-code-outline', color: COLORS.upi },
    { id: 'card', label: 'Card', icon: 'card-outline', color: COLORS.card },
  ];

  return (
    <ModalContainer visible={visible} onClose={onClose} title="Complete Payment">
      <View style={styles.container}>
        {/* Total Banner */}
        <View
          style={[
            styles.totalBanner,
            { backgroundColor: isDark ? colors.surfaceSubtle : '#ecfdf5' },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Amount Due</Text>
          <Text style={[styles.totalAmount, { color: COLORS.primary }]}>
            {formatCurrency(total, currency)}
          </Text>
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Select Payment Mode
        </Text>
        <View style={styles.methodsRow}>
          {methods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                activeOpacity={0.8}
                style={[
                  styles.methodCard,
                  {
                    borderColor: isSelected ? method.color : colors.border,
                    backgroundColor: isSelected
                      ? isDark
                        ? colors.surfaceSubtle
                        : '#f8fafc'
                      : colors.surface,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={method.icon}
                  size={24}
                  color={isSelected ? method.color : colors.textMuted}
                />
                <Text
                  style={[
                    styles.methodLabel,
                    {
                      color: isSelected ? colors.text : colors.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cash Calculator if Cash selected */}
        {selectedMethod === 'cash' && (
          <View style={styles.cashCalculator}>
            <Input
              label="Cash Received"
              placeholder={`e.g. ${Math.ceil(total / 100) * 100}`}
              value={cashTendered}
              onChangeText={setCashTendered}
              keyboardType="numeric"
              leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textMuted} />}
            />
            {tenderedNum >= total && (
              <View style={[styles.changeBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}>
                <Text style={[styles.changeLabel, { color: colors.textMuted }]}>Change Due:</Text>
                <Text style={[styles.changeAmount, { color: COLORS.primary }]}>
                  {formatCurrency(changeDue, currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        <Button
          title={`Confirm ${selectedMethod.toUpperCase()} Payment`}
          onPress={handleConfirm}
          loading={loading}
          size="lg"
          style={styles.confirmBtn}
        />
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  totalBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  methodLabel: {
    fontSize: 12,
  },
  cashCalculator: {
    marginTop: 4,
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: -4,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  changeAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  confirmBtn: {
    marginTop: 8,
  },
});
