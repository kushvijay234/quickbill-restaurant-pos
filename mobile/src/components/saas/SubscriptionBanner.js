import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionService } from '../../services/subscriptionService';
import { COLORS } from '../../constants/colors';
import { TRIAL_PERIOD_DAYS } from '../../constants/config';

export const SubscriptionBanner = ({ onOpenSubscription, refreshTrigger }) => {
  const [subData, setSubData] = useState(null);

  useEffect(() => {
    subscriptionService.getCurrentSubscription().then((data) => {
      setSubData(data);
    });
  }, [refreshTrigger]);

  if (!subData?.tenant) return null;

  const { status } = subData.tenant;
  const daysRemaining = subData.daysRemaining;

  // Only display if trialing, expiring soon, or non-active
  const isTrial = status === 'trialing';
  const isExpiring = typeof daysRemaining === 'number' && daysRemaining <= 3;
  const isPastDue = status === 'past_due' || status === 'suspended' || (isTrial && typeof daysRemaining === 'number' && daysRemaining <= 0);

  if (!isTrial && !isExpiring && !isPastDue) return null;

  let bg = '#eff6ff';
  let textCol = '#1e40af';
  let message = `Trial Plan • ${daysRemaining ?? TRIAL_PERIOD_DAYS} days remaining`;

  if (isPastDue) {
    bg = '#fee2e2';
    textCol = '#b91c1c';
    message = isTrial
      ? 'Trial expired. Please choose a plan to continue.'
      : 'Subscription past due. Please renew plan.';
  } else if (isTrial && typeof daysRemaining === 'number' && daysRemaining <= 1) {
    bg = '#fef3c7';
    textCol = '#92400e';
    message = `Trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Tap to upgrade.`;
  } else if (!isTrial && isExpiring) {
    bg = '#fef3c7';
    textCol = '#92400e';
    message = `Plan expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Tap to upgrade.`;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onOpenSubscription}
      style={[styles.banner, { backgroundColor: bg }]}
    >
      <View style={styles.leftRow}>
        <Ionicons name="sparkles" size={16} color={textCol} />
        <Text style={[styles.text, { color: textCol }]} numberOfLines={1}>
          {message}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={textCol} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
