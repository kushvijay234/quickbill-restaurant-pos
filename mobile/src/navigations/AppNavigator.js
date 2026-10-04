import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { CartCheckoutScreen } from '../screens/pos/CartCheckoutScreen';
import { StaffManagementScreen } from '../screens/admin/StaffManagementScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';
import { RestaurantProfileScreen } from '../screens/profile/RestaurantProfileScreen';
import { SubscriptionScreen } from '../screens/subscription/SubscriptionScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: COLORS.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen
              name="CartCheckout"
              component={CartCheckoutScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <RootStack.Screen name="StaffManagement" component={StaffManagementScreen} />
            <RootStack.Screen name="AuditLogs" component={AuditLogsScreen} />
            <RootStack.Screen name="Profile" component={RestaurantProfileScreen} />
            <RootStack.Screen name="Subscription" component={SubscriptionScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
