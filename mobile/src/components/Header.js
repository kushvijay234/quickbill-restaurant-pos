import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from './common/Badge';
import { COLORS } from '../constants/colors';

export const Header = ({ onOpenProfile }) => {
  const insets = useSafeAreaInsets();
  const { user, profile, tenantSlug, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your POS session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const displayName = profile?.restaurantName || 'QuickBill POS';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenProfile}
          style={styles.profileTrigger}
        >
          <View style={styles.brandIcon}>
            <Ionicons name="restaurant" size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.badgeRow}>
              {tenantSlug ? (
                <Text style={[styles.slugText, { color: colors.textMuted }]}>
                  {tenantSlug}
                </Text>
              ) : null}
              {user?.role ? (
                <Badge
                  label={user.role}
                  variant={user.role === 'admin' ? 'role' : 'info'}
                  size="sm"
                />
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.rightRow}>
        {/* Dark / Light Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconButton, { backgroundColor: isDark ? colors.surfaceSubtle : '#f1f5f9' }]}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={isDark ? '#f59e0b' : '#475569'}
          />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogoutPress}
          style={[styles.iconButton, { backgroundColor: '#fee2e2' }]}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    maxWidth: 220,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  slugText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
