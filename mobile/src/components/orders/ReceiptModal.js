import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../constants/currencies';
import { printService } from '../../services/printService';
import { COLORS } from '../../constants/colors';

export const ReceiptModal = ({ visible, onClose, order, profile, onStartNewBill }) => {
  const { colors, isDark } = useTheme();
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!order) return null;

  const currency = order.currency || { symbol: '₹' };
  const items = order.items || [];
  const orderId = order.id ? order.id.slice(-6).toUpperCase() : 'NEW';

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await printService.printOrder(order, profile);
    } catch (e) {
      Alert.alert('Printing Error', e.message || 'Could not connect to printer');
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      await printService.shareOrderPdf(order, profile);
    } catch (e) {
      Alert.alert('Share Error', e.message || 'Could not export PDF');
    } finally {
      setSharing(false);
    }
  };

  return (
    <ModalContainer visible={visible} onClose={onClose} title={`Receipt #${orderId}`}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Receipt Container simulating thermal paper */}
        <View style={[styles.receiptPaper, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}>
          <Text style={[styles.restaurantTitle, { color: colors.text }]}>
            {profile?.restaurantName || 'QuickBill POS'}
          </Text>
          {profile?.address ? (
            <Text style={[styles.restaurantSub, { color: colors.textMuted }]}>{profile.address}</Text>
          ) : null}
          {profile?.phone ? (
            <Text style={[styles.restaurantSub, { color: colors.textMuted }]}>Phone: {profile.phone}</Text>
          ) : null}

          <View style={styles.dashedLine} />

          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Order #{orderId}</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {order.date ? new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
            </Text>
          </View>
          {order.customer?.name ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>Customer:</Text>
              <Text style={[styles.metaTextBold, { color: colors.text }]}>{order.customer.name}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Payment:</Text>
            <Text style={[styles.metaTextBold, { color: colors.text, textTransform: 'uppercase' }]}>
              {order.paymentMethod || 'Cash'}
            </Text>
          </View>

          <View style={styles.dashedLine} />

          {/* Items breakdown */}
          {items.map((it, idx) => {
            const variantName = it.selectedVariant?.name ? ` (${it.selectedVariant.name})` : '';
            const unitPrice = it.selectedVariant?.price || 0;
            const lineTotal = unitPrice * (it.quantity || 1);

            return (
              <View key={idx} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {it.item?.name}
                    {variantName}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                    {it.quantity} x {formatCurrency(unitPrice, currency)}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, { color: colors.text }]}>
                  {formatCurrency(lineTotal, currency)}
                </Text>
              </View>
            );
          })}

          <View style={styles.dashedLine} />

          {/* Subtotal & Tax */}
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.calcVal, { color: colors.text }]}>
              {formatCurrency(order.subtotal, currency)}
            </Text>
          </View>
          {order.tax > 0 ? (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>Tax</Text>
              <Text style={[styles.calcVal, { color: colors.text }]}>
                {formatCurrency(order.tax, currency)}
              </Text>
            </View>
          ) : null}

          <View style={styles.dashedLine} />

          {/* Net Total */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>TOTAL</Text>
            <Text style={[styles.totalVal, { color: COLORS.primary }]}>
              {formatCurrency(order.total, currency)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <View style={styles.dualActions}>
            <Button
              title="Print Receipt"
              onPress={handlePrint}
              loading={printing}
              icon={<Ionicons name="print-outline" size={18} color="#ffffff" />}
              style={{ flex: 1 }}
            />
            <Button
              title="Share PDF"
              variant="secondary"
              onPress={handleShare}
              loading={sharing}
              icon={<Ionicons name="share-social-outline" size={18} color="#ffffff" />}
              style={{ flex: 1 }}
            />
          </View>

          {onStartNewBill ? (
            <Button
              title="Start New Bill"
              variant="outline"
              onPress={() => {
                onClose();
                onStartNewBill();
              }}
              style={styles.newBillBtn}
            />
          ) : null}
        </View>
      </ScrollView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    gap: 16,
  },
  receiptPaper: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  restaurantTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  restaurantSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 0.7,
    borderColor: '#94a3b8',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  metaText: {
    fontSize: 12,
  },
  metaTextBold: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  calcLabel: {
    fontSize: 12,
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  actionButtons: {
    gap: 10,
  },
  dualActions: {
    flexDirection: 'row',
    gap: 10,
  },
  newBillBtn: {
    marginTop: 4,
  },
});
