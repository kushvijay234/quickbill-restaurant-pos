import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { useTheme } from '../../context/ThemeContext';

export const CustomerInputForm = ({ customer, onChange }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Input
        label="Customer Name (Optional)"
        placeholder="e.g. John Doe / Walk-in"
        value={customer.name}
        onChangeText={(text) => onChange({ ...customer, name: text })}
        leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
      />
      <Input
        label="Phone Number (For SMS Bill)"
        placeholder="e.g. 9876543210"
        value={customer.mobile}
        onChangeText={(text) => onChange({ ...customer, mobile: text })}
        keyboardType="phone-pad"
        leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
});
