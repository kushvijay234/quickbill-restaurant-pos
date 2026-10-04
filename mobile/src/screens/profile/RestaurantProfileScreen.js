import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { profileService } from '../../services/profileService';
import { CURRENCIES } from '../../constants/currencies';
import { COLORS } from '../../constants/colors';

export const RestaurantProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { profile, refreshProfile } = useAuth();

  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxRatePercent, setTaxRatePercent] = useState('5');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('INR');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setRestaurantName(profile.restaurantName || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      const rate = typeof profile.taxRate === 'number' ? (profile.taxRate * 100).toString() : '5';
      setTaxRatePercent(rate);
      setSelectedCurrencyCode(profile.currency || 'INR');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Validation Error', 'Restaurant name is required');
      return;
    }

    const rateNum = parseFloat(taxRatePercent);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      Alert.alert('Validation Error', 'Please enter a valid tax percentage between 0 and 100');
      return;
    }

    const selectedCurrency = CURRENCIES.find((c) => c.code === selectedCurrencyCode) || CURRENCIES[0];

    try {
      setSaving(true);
      await profileService.updateProfile({
        restaurantName: restaurantName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        taxRate: rateNum / 100,
        currency: selectedCurrency.code,
        currencySymbol: selectedCurrency.symbol,
      });

      await refreshProfile();
      Alert.alert('Success', 'Restaurant profile settings updated successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Restaurant Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>General Information</Text>

          <Input
            label="Restaurant Name *"
            placeholder="e.g. Cafe Delight"
            value={restaurantName}
            onChangeText={setRestaurantName}
            leftIcon={<Ionicons name="restaurant-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Address"
            placeholder="Street address, City, ZIP"
            value={address}
            onChangeText={setAddress}
            leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
          />

          <Input
            label="Contact Phone Number"
            placeholder="Phone printed on thermal receipts"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Tax & Currency Settings</Text>

          <Input
            label="Default Sales Tax Rate (%)"
            placeholder="e.g. 5"
            value={taxRatePercent}
            onChangeText={setTaxRatePercent}
            keyboardType="numeric"
            leftIcon={<Ionicons name="calculator-outline" size={18} color={colors.textMuted} />}
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
            Default Currency
          </Text>

          <View style={styles.currencyGrid}>
            {CURRENCIES.map((curr) => {
              const isSelected = selectedCurrencyCode === curr.code;
              return (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => setSelectedCurrencyCode(curr.code)}
                  style={[
                    styles.currOption,
                    {
                      backgroundColor: isSelected
                        ? COLORS.primary
                        : isDark
                        ? colors.surfaceSubtle
                        : '#f8fafc',
                      borderColor: isSelected ? COLORS.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currSymbol,
                      { color: isSelected ? '#ffffff' : colors.text },
                    ]}
                  >
                    {curr.symbol}
                  </Text>
                  <Text
                    style={[
                      styles.currCode,
                      { color: isSelected ? '#ffffff' : colors.textMuted },
                    ]}
                  >
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Button
          title="Save Settings"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    padding: 4,
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  currSymbol: {
    fontSize: 16,
    fontWeight: '900',
  },
  currCode: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 8,
  },
});
