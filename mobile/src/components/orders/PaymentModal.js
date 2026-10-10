import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
  const [paymentRef, setPaymentRef] = useState('');

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = tenderedNum > total ? tenderedNum - total : 0;

  const handleConfirm = () => {
    onConfirm(selectedMethod, paymentRef);
  };

  const methods = [
    { id: 'cash', label: 'Cash', icon: 'cash-outline', color: COLORS.cash },
    { id: 'upi', label: 'UPI / QR', icon: 'qr-code-outline', color: COLORS.upi },
    { id: 'card', label: 'Card', icon: 'card-outline', color: COLORS.card },
  ];

  const quickCashPresets = [
    { label: 'Exact', amount: total },
    { label: '+₹50', amount: Math.ceil((total + 50) / 10) * 10 },
    { label: '+₹100', amount: Math.ceil((total + 100) / 50) * 50 },
    { label: '₹500', amount: 500 },
  ].filter(p => p.amount >= total);

  return (
    <ModalContainer visible={visible} onClose={onClose} title="Complete Payment">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Total Amount Due Banner */}
        <View
          style={[
            styles.totalBanner,
            { backgroundColor: isDark ? colors.surfaceSubtle : '#ecfdf5', borderColor: '#a7f3d0' },
          ]}
        >
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Amount Due</Text>
          <Text style={[styles.totalAmount, { color: COLORS.primary }]}>
            {formatCurrency(total, currency)}
          </Text>
        </View>

        {/* Payment Methods Selection */}
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

        {/* Mode 1: Cash Calculator & Quick Presets */}
        {selectedMethod === 'cash' && (
          <View style={styles.detailsBox}>
            <View style={styles.quickCashRow}>
              {quickCashPresets.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => setCashTendered(String(preset.amount))}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.presetChipText, { color: colors.text }]}>
                    {preset.label} ({formatCurrency(preset.amount, currency)})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Cash Received from Customer"
              placeholder={`e.g. ${Math.ceil(total / 100) * 100 || total}`}
              value={cashTendered}
              onChangeText={setCashTendered}
              keyboardType="numeric"
              leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textMuted} />}
            />

            {tenderedNum >= total && (
              <View style={[styles.changeBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#ecfdf5' }]}>
                <Text style={[styles.changeLabel, { color: colors.textSecondary }]}>Change Due to Return:</Text>
                <Text style={[styles.changeAmount, { color: COLORS.primary }]}>
                  {formatCurrency(changeDue, currency)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Mode 2: UPI / QR Code Guide */}
        {selectedMethod === 'upi' && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#faf5ff',
                borderColor: '#e9d5ff',
              },
            ]}
          >
            <View style={styles.infoCardHeader}>
              <Ionicons name="qr-code-outline" size={28} color={COLORS.upi} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                  UPI / QR Scan & Pay
                </Text>
                <Text style={[styles.infoCardDesc, { color: colors.textMuted }]}>
                  Show restaurant QR code to customer for {formatCurrency(total, currency)} payment.
                </Text>
              </View>
            </View>

            <Input
              label="Transaction / UTR Ref (Optional)"
              placeholder="e.g. 12-digit UTR or GPay Ref"
              value={paymentRef}
              onChangeText={setPaymentRef}
              leftIcon={<Ionicons name="receipt-outline" size={18} color={colors.textMuted} />}
              style={{ marginTop: 8, marginBottom: 0 }}
            />
          </View>
        )}

        {/* Mode 3: Card Terminal Guide */}
        {selectedMethod === 'card' && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? colors.surfaceSubtle : '#eff6ff',
                borderColor: '#bfdbfe',
              },
            ]}
          >
            <View style={styles.infoCardHeader}>
              <Ionicons name="card-outline" size={28} color={COLORS.card} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>
                  Card Machine / EDC Terminal
                </Text>
                <Text style={[styles.infoCardDesc, { color: colors.textMuted }]}>
                  Swipe, tap, or dip Debit/Credit card for {formatCurrency(total, currency)}.
                </Text>
              </View>
            </View>

            <Input
              label="Card Auth / Txn Ref (Optional)"
              placeholder="e.g. Last 4 digits or Auth Slip #"
              value={paymentRef}
              onChangeText={setPaymentRef}
              leftIcon={<Ionicons name="keypad-outline" size={18} color={colors.textMuted} />}
              style={{ marginTop: 8, marginBottom: 0 }}
            />
          </View>
        )}

        {/* Action Button */}
        <Button
          title={`Confirm ${selectedMethod.toUpperCase()} (${formatCurrency(total, currency)})`}
          onPress={handleConfirm}
          loading={loading}
          size="lg"
          style={styles.confirmBtn}
        />
      </ScrollView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 10,
  },
  totalBanner: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  methodLabel: {
    fontSize: 12,
  },
  detailsBox: {
    gap: 10,
  },
  quickCashRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 17,
    fontWeight: '900',
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCardDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  confirmBtn: {
    marginTop: 6,
  },
});
