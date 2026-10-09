import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { FastBilloLogo } from '../../components/common/FastBilloLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { storageService } from '../../services/storageService';
import { setApiBaseUrl, getApiBaseUrl } from '../../services/api';
import { LOCAL_API_URL, CLOUD_API_URL, DEFAULT_API_URL, TRIAL_PERIOD_DAYS } from '../../constants/config';
import { COLORS } from '../../constants/colors';

export const LoginScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { login } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Server URL config
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customApiUrl, setCustomApiUrlState] = useState('');

  useEffect(() => {
    storageService.getCustomApiUrl().then((saved) => {
      const active = saved || DEFAULT_API_URL;
      setCustomApiUrlState(active);
      setApiBaseUrl(active);
    });
  }, []);

  const handleLogin = async () => {
    setErrorMsg('');
    const cleanIdentifier = usernameOrEmail.trim();
    if (!cleanIdentifier || !password) {
      setErrorMsg('Please enter your email/username and password');
      return;
    }

    try {
      setLoading(true);
      await login(cleanIdentifier, password);
    } catch (e) {
      setErrorMsg(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const applyServerPreset = async (url) => {
    await storageService.setCustomApiUrl(url);
    setApiBaseUrl(url);
    setCustomApiUrlState(url);
    setErrorMsg('');
    Alert.alert('Server Selected', `Now connecting to: ${url}`);
  };

  const handleSaveCustomServer = async () => {
    const trimmed = customApiUrl.trim();
    if (trimmed) {
      await storageService.setCustomApiUrl(trimmed);
      setApiBaseUrl(trimmed);
      setErrorMsg('');
      Alert.alert('Updated', `API URL set to: ${trimmed}`);
      setShowServerConfig(false);
    }
  };

  const isLocalActive = customApiUrl === LOCAL_API_URL;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <FastBilloLogo size={76} showBrandText={false} style={{ marginBottom: 14 }} />

            <Text style={[styles.brandTitle, { color: colors.text }]}>
              FAST<Text style={{ color: '#16a34a' }}>BILLO</Text>
            </Text>

            <Text style={[styles.brandTagline, { color: '#16a34a' }]}>
              BILL FAST. GROW FASTER.
            </Text>

            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Sign in to your restaurant workspace
            </Text>
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
              label="Email Address or Username"
              placeholder="e.g. test or owner@restaurant.com"
              value={usernameOrEmail}
              onChangeText={(text) => {
                setUsernameOrEmail(text);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMsg) setErrorMsg('');
              }}
              secureTextEntry={true}
              autoCapitalize="none"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.signInBtn}
            />

            {/* Register Action */}
            <View style={[styles.registerSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.registerPrompt, { color: colors.textMuted }]}>
                New to FASTBILLO?
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Register')}
                style={[styles.registerBtn, { backgroundColor: isDark ? colors.surfaceSubtle : '#f0fdf4', borderColor: '#bbf7d0' }]}
              >
                <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                <Text style={[styles.registerBtnText, { color: COLORS.primary }]}>
                  Register Your Restaurant ({TRIAL_PERIOD_DAYS}-Day Free Trial)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Server Environment Bar */}
            <View style={[styles.serverEnvBar, { borderTopColor: colors.border }]}>
              <View style={styles.serverStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isLocalActive ? '#10b981' : '#3b82f6' },
                  ]}
                />
                <Text style={[styles.serverStatusText, { color: colors.textMuted }]} numberOfLines={1}>
                  {isLocalActive ? 'Local Backend (192.168.1.42:5000)' : 'Cloud Backend (Render)'}
                </Text>
                <TouchableOpacity onPress={() => setShowServerConfig((prev) => !prev)}>
                  <Text style={[styles.changeLink, { color: COLORS.primary }]}>
                    {showServerConfig ? 'Close' : 'Change'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showServerConfig && (
                <View
                  style={[
                    styles.serverConfigBox,
                    { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' },
                  ]}
                >
                  <Text style={[styles.presetLabel, { color: colors.textSecondary }]}>
                    Quick Server Switch:
                  </Text>
                  <View style={styles.presetsRow}>
                    <TouchableOpacity
                      onPress={() => applyServerPreset(LOCAL_API_URL)}
                      style={[
                        styles.presetBtn,
                        {
                          backgroundColor: isLocalActive ? COLORS.primary : 'transparent',
                          borderColor: isLocalActive ? COLORS.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          { color: isLocalActive ? '#ffffff' : colors.text },
                        ]}
                      >
                        Local Server
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => applyServerPreset(CLOUD_API_URL)}
                      style={[
                        styles.presetBtn,
                        {
                          backgroundColor: !isLocalActive ? COLORS.primary : 'transparent',
                          borderColor: !isLocalActive ? COLORS.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          { color: !isLocalActive ? '#ffffff' : colors.text },
                        ]}
                      >
                        Render Cloud
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Input
                    label="Custom API Endpoint"
                    placeholder="http://192.168.x.x:5000/api"
                    value={customApiUrl}
                    onChangeText={setCustomApiUrlState}
                    autoCapitalize="none"
                    style={{ marginTop: 8 }}
                  />
                  <Button
                    title="Apply Custom URL"
                    variant="outline"
                    size="sm"
                    onPress={handleSaveCustomServer}
                  />
                </View>
              )}
            </View>
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
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
  registerSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  registerPrompt: {
    fontSize: 12,
    fontWeight: '600',
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  registerBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  serverEnvBar: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatusText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  serverConfigBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
