import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Badge = ({ label, variant = 'primary', size = 'sm', style, textStyle }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'warning':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'danger':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'info':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'role':
        return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.badge,
        styles[size],
        { backgroundColor: scheme.bg, borderColor: scheme.border },
        style,
      ]}
    >
      <Text style={[styles.text, styles[`${size}Text`], { color: scheme.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  md: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  smText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  mdText: {
    fontSize: 12,
  },
});
