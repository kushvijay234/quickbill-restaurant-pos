import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { AppNavigator } from './src/navigations/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { logger } from './src/services/logger';

// Register global runtime crash and error handler to write to database
if (typeof global !== 'undefined' && global.ErrorUtils) {
  const originalErrorHandler =
    typeof global.ErrorUtils.getGlobalHandler === 'function'
      ? global.ErrorUtils.getGlobalHandler()
      : null;

  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.error(
      `Unhandled ${isFatal ? 'Fatal' : 'Non-Fatal'} Mobile Error: ${error?.message || error}`,
      { isFatal },
      error
    );

    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
}

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
