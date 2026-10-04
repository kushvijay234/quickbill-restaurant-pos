import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';

export const LoginScreen = ({ route, navigation }) => {
  const { colors, isDark } = useTheme();
  const { login, tenantSlug } = useAuth();

  const activeSlug = route.params?.slug || tenantSlug || '';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password, activeSlug);
      // Navigation will be automatically updated by AppNavigator based on isAuthenticated state
    } catch (e) {
      setErrorMsg(e.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <Ionicons name="lock-closed" size={32} color="#ffffff" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>POS Sign In</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Enter your Cashier or Admin credentials
            </Text>

            {/* Restaurant Indicator */}
            {activeSlug ? (
              <View style={styles.tenantPill}>
                <Text style={[styles.tenantPillText, { color: colors.textMuted }]}>Restaurant:</Text>
                <Badge label={activeSlug} variant="role" size="sm" />
                <TouchableOpacity
                  onPress={() => navigation.navigate('TenantSelect')}
                  style={styles.switchTenantBtn}
                >
                  <Text style={[styles.switchTenantText, { color: COLORS.accent }]}>Switch</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Login Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Input
              label="Username or Email"
              placeholder="e.g. admin or cashier1"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              leftIcon={<Ionicons name="key-outline" size={18} color={colors.textMuted} />}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.signInBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  tenantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tenantPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchTenantBtn: {
    paddingHorizontal: 4,
  },
  switchTenantText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  signInBtn: {
    marginTop: 8,
  },
});
