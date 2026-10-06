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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../constants/colors';
import { TRIAL_PERIOD_DAYS } from '../../constants/config';

const COUNTRY_OPTIONS = [
  { country: 'India', currency: 'INR', symbol: '₹', phoneCode: '+91', flag: '🇮🇳', phonePlaceholder: '9876543210' },
  { country: 'United States', currency: 'USD', symbol: '$', phoneCode: '+1', flag: '🇺🇸', phonePlaceholder: '2025550143' },
  { country: 'United Kingdom', currency: 'GBP', symbol: '£', phoneCode: '+44', flag: '🇬🇧', phonePlaceholder: '7911123456' },
  { country: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', phoneCode: '+971', flag: '🇦🇪', phonePlaceholder: '501234567' },
  { country: 'European Union', currency: 'EUR', symbol: '€', phoneCode: '+33', flag: '🇪🇺', phonePlaceholder: '612345678' },
  { country: 'Canada', currency: 'CAD', symbol: '$', phoneCode: '+1', flag: '🇨🇦', phonePlaceholder: '4165550198' },
  { country: 'Australia', currency: 'AUD', symbol: '$', phoneCode: '+61', flag: '🇦🇺', phonePlaceholder: '412345678' },
  { country: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', phoneCode: '+966', flag: '🇸🇦', phonePlaceholder: '512345678' },
  { country: 'Singapore', currency: 'SGD', symbol: '$', phoneCode: '+65', flag: '🇸🇬', phonePlaceholder: '81234567' },
  { country: 'Global / Other', currency: 'USD', symbol: '$', phoneCode: '+1', flag: '🌐', phonePlaceholder: '1234567890' },
];

export const RegisterScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { register } = useAuth();

  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS[0]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password validation rules
  const hasMinLength = ownerPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(ownerPassword);
  const hasNumber = /[0-9]/.test(ownerPassword);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(ownerPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

  const handleRegister = async () => {
    setErrorMsg('');

    const cleanRestName = restaurantName.trim();
    const cleanOwnerName = ownerName.trim();
    const cleanEmail = ownerEmail.trim().toLowerCase();
    const cleanPhone = ownerPhone.trim();

    if (!cleanRestName || !cleanEmail || !ownerPassword) {
      setErrorMsg('Please enter restaurant name, email, and password.');
      return;
    }

    if (cleanRestName.length > 69) {
      setErrorMsg('Restaurant name cannot exceed 69 characters.');
      return;
    }

    if (cleanOwnerName.length > 30) {
      setErrorMsg('Owner name cannot exceed 30 characters.');
      return;
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      setErrorMsg('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please fulfill all password requirements below.');
      return;
    }

    try {
      setLoading(true);
      await register({
        restaurantName: cleanRestName,
        ownerName: cleanOwnerName || cleanRestName,
        ownerEmail: cleanEmail,
        ownerPhone: cleanPhone,
        ownerPassword,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.symbol,
      });

      Alert.alert(
        'Registration Successful! 🎉',
        `Welcome to QuickBill! Your ${TRIAL_PERIOD_DAYS}-day free trial for "${cleanRestName}" is now active.`,
        [{ text: 'Get Started' }]
      );
    } catch (err) {
      const msg = err.message || 'Failed to register restaurant';
      if (err.status === 409 || err.code === 'ACCOUNT_EXISTS' || msg.toLowerCase().includes('already')) {
        Alert.alert(
          'Account Already Registered',
          msg,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Sign In',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        setErrorMsg(msg);
      }
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Header Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: colors.text }]}>Create Restaurant Account</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIconWrapper}>
              <Ionicons name="restaurant" size={28} color="#ffffff" />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>
              RESTO<Text style={{ color: COLORS.primary }}>BILL</Text>
            </Text>
            <Text style={[styles.brandTagline, { color: COLORS.primary }]}>
              BILL. SERVE. GROW.
            </Text>
          </View>

          {/* Free Trial Banner */}
          <View style={styles.trialBanner}>
            <Ionicons name="sparkles" size={20} color="#4338ca" />
            <View style={{ flex: 1 }}>
              <Text style={styles.trialTitle}>{TRIAL_PERIOD_DAYS}-Day Free Trial Included</Text>
              <Text style={styles.trialSub}>Full POS access • No credit card required</Text>
            </View>
          </View>

          {/* Registration Card */}
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

            {/* Restaurant Name */}
            <Input
              label="Restaurant Name *"
              placeholder="e.g. Spice Route Bistro"
              value={restaurantName}
              onChangeText={(text) => {
                setRestaurantName(text);
                if (errorMsg) setErrorMsg('');
              }}
              leftIcon={<Ionicons name="business-outline" size={18} color={colors.textMuted} />}
            />

            {/* Owner Name */}
            <Input
              label="Owner / Manager Name"
              placeholder="e.g. Rajesh Kumar"
              value={ownerName}
              onChangeText={setOwnerName}
              leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
            />

            {/* Country & Currency Selection */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Country & Primary Currency
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryScroll}
            >
              {COUNTRY_OPTIONS.map((c) => {
                const isSelected = selectedCountry.country === c.country;
                return (
                  <TouchableOpacity
                    key={c.country}
                    onPress={() => setSelectedCountry(c)}
                    style={[
                      styles.countryChip,
                      {
                        backgroundColor: isSelected
                          ? COLORS.primary
                          : isDark
                          ? colors.surfaceSubtle
                          : '#f1f5f9',
                        borderColor: isSelected ? COLORS.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.countryFlag}>{c.flag}</Text>
                    <Text
                      style={[
                        styles.countryName,
                        { color: isSelected ? '#ffffff' : colors.text },
                      ]}
                    >
                      {c.currency} ({c.symbol})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Mobile Number */}
            <Input
              label="Contact Phone Number (10 digits)"
              placeholder={selectedCountry.phonePlaceholder}
              value={ownerPhone}
              onChangeText={setOwnerPhone}
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
            />

            {/* Owner Email */}
            <Input
              label="Owner Email Address *"
              placeholder="owner@restaurant.com"
              value={ownerEmail}
              onChangeText={(text) => {
                setOwnerEmail(text);
                if (errorMsg) setErrorMsg('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />

            {/* Password */}
            <Input
              label="Password *"
              placeholder="Min. 8 characters"
              value={ownerPassword}
              onChangeText={(text) => {
                setOwnerPassword(text);
                if (errorMsg) setErrorMsg('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {/* Password Requirement Checklist */}
            <View style={[styles.pwdRulesBox, { backgroundColor: isDark ? colors.surfaceSubtle : '#f8fafc' }]}>
              <Text style={[styles.pwdRulesTitle, { color: colors.textSecondary }]}>
                Password Requirements:
              </Text>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={hasMinLength ? '#10b981' : colors.textMuted}
                />
                <Text style={[styles.ruleText, { color: hasMinLength ? '#10b981' : colors.textMuted }]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={hasUppercase ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={hasUppercase ? '#10b981' : colors.textMuted}
                />
                <Text style={[styles.ruleText, { color: hasUppercase ? '#10b981' : colors.textMuted }]}>
                  At least 1 uppercase letter (A-Z)
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={hasNumber ? '#10b981' : colors.textMuted}
                />
                <Text style={[styles.ruleText, { color: hasNumber ? '#10b981' : colors.textMuted }]}>
                  At least 1 number (0-9)
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name={hasSpecialChar ? 'checkmark-circle' : 'ellipse-outline'}
                  size={15}
                  color={hasSpecialChar ? '#10b981' : colors.textMuted}
                />
                <Text style={[styles.ruleText, { color: hasSpecialChar ? '#10b981' : colors.textMuted }]}>
                  At least 1 special character (!@#$%^&*)
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              title={`Start ${TRIAL_PERIOD_DAYS}-Day Free Trial`}
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Switch to Login */}
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: colors.textMuted }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.loginLink, { color: COLORS.primary }]}> Sign In</Text>
              </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#e0e7ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  trialTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730a3',
  },
  trialSub: {
    fontSize: 12,
    color: '#4338ca',
    marginTop: 1,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  countryScroll: {
    gap: 8,
    marginBottom: 16,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pwdRulesBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 6,
  },
  pwdRulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submitBtn: {
    marginBottom: 16,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
