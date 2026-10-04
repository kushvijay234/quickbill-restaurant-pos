import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { storageService } from '../../services/storageService';
import { setApiBaseUrl, getApiBaseUrl } from '../../services/api';
import { COLORS } from '../../constants/colors';

export const TenantSelectScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { setTenantSlug, tenantSlug: initialSlug } = useAuth();
  const [slug, setSlug] = useState(initialSlug || '');
  const [customApiUrl, setCustomApiUrlState] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storageService.getCustomApiUrl().then((saved) => {
      setCustomApiUrlState(saved || getApiBaseUrl());
    });
  }, []);

  const handleContinue = async () => {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      Alert.alert('Required', 'Please enter your restaurant slug (e.g. cafe-delight or demo)');
      return;
    }

    try {
      setLoading(true);
      await setTenantSlug(cleanSlug);
      navigation.navigate('Login', { slug: cleanSlug });
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not select restaurant');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    const trimmed = customApiUrl.trim();
    if (trimmed) {
      await storageService.setCustomApiUrl(trimmed);
      setApiBaseUrl(trimmed);
      Alert.alert('Updated', `API endpoint set to: ${trimmed}`);
      setShowServerConfig(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Logo & Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <Ionicons name="restaurant" size={36} color="#ffffff" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>QuickBill POS</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              Fast, Modern Restaurant Billing & Order Management
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.text }]}>Find Your Restaurant</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
              Enter your restaurant workspace identifier to sign in:
            </Text>

            <Input
              label="Restaurant Slug"
              placeholder="e.g. cafe-delight or my-bistro"
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              leftIcon={<Ionicons name="business-outline" size={18} color={colors.textMuted} />}
            />

            <Button
              title="Continue to Login"
              onPress={handleContinue}
              loading={loading}
              size="lg"
              style={styles.continueBtn}
            />

            {/* Server Settings Accordion */}
            <TouchableOpacity
              onPress={() => setShowServerConfig((prev) => !prev)}
              style={styles.serverSettingsToggle}
            >
              <Ionicons name="hardware-chip-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.serverSettingsText, { color: colors.textMuted }]}>
                {showServerConfig ? 'Hide Server URL Settings' : 'Configure Backend Server URL'}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={[styles.serverConfigBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}>
                <Input
                  label="API Server URL"
                  placeholder="https://.../api or http://192.168.x.x:5000/api"
                  value={customApiUrl}
                  onChangeText={setCustomApiUrlState}
                  autoCapitalize="none"
                />
                <Button
                  title="Apply API Server URL"
                  variant="outline"
                  size="sm"
                  onPress={handleSaveServerUrl}
                />
              </View>
            )}
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
    marginBottom: 32,
  },
  brandIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 20,
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
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 18,
  },
  continueBtn: {
    marginTop: 6,
  },
  serverSettingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  serverSettingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serverConfigBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
});
