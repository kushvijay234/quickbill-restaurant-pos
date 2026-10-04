import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TenantSelectScreen } from '../screens/auth/TenantSelectScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="TenantSelect"
    >
      <Stack.Screen name="TenantSelect" component={TenantSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};
