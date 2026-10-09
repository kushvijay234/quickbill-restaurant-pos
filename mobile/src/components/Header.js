import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from './common/Badge';
import { SideMenuModal } from './navigation/SideMenuModal';
import { FastBilloLogo } from './common/FastBilloLogo';
import { COLORS } from '../constants/colors';

export const Header = ({ onAddItem, rightAction }) => {
  const insets = useSafeAreaInsets();
  const { user, profile, tenantSlug } = useAuth();
  const { colors } = useTheme();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const topInset = Platform.OS === 'android'
    ? Math.max(insets.top, StatusBar.currentHeight || 24)
    : insets.top;

  const displayName = profile?.restaurantName || 'FASTBILLO POS';

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(topInset, 12) + 6,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Left: App/Restaurant Icon that opens Side Menu */}
        <View style={styles.leftRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSideMenuVisible(true)}
            style={styles.profileTrigger}
          >
            <FastBilloLogo size={38} showBrandText={false} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[styles.restaurantName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
              </View>
              <View style={styles.badgeRow}>
                {tenantSlug ? (
                  <Text style={[styles.slugText, { color: colors.textMuted }]} numberOfLines={1}>
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

        {/* Right: Add Item button or custom right action */}
        <View style={styles.rightRow}>
          {rightAction ? (
            rightAction
          ) : onAddItem ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAddItem}
              style={styles.addItemBtn}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Side Menu Drawer */}
      <SideMenuModal
        visible={sideMenuVisible}
        onClose={() => setSideMenuVisible(false)}
      />
    </>
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
    maxWidth: 200,
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
    justifyContent: 'flex-end',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addItemBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
