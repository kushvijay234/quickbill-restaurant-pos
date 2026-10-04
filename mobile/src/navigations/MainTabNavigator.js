import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PosBillingScreen } from '../screens/pos/PosBillingScreen';
import { PastOrdersScreen } from '../screens/orders/PastOrdersScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { RestaurantProfileScreen } from '../screens/profile/RestaurantProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'POS') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="POS" component={PosBillingScreen} />
      <Tab.Screen name="Orders" component={PastOrdersScreen} />
      {isAdmin && <Tab.Screen name="Admin" component={AdminDashboardScreen} />}
      <Tab.Screen name="Settings" component={RestaurantProfileScreen} />
    </Tab.Navigator>
  );
};
