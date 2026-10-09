import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';

export const Button = ({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline'
  size = 'md',        // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.button?.disabledBackground || '#94a3b8';
    switch (variant) {
      case 'primary':
        return COLORS.button?.background || COLORS.primary;
      case 'secondary':
        return COLORS.button?.secondaryBackground || '#3b82f6';
      case 'danger':
        return COLORS.button?.dangerBackground || COLORS.danger;
      case 'outline':
        return 'transparent';
      default:
        return COLORS.button?.background || COLORS.primary;
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return disabled
        ? (COLORS.button?.disabledText || '#94a3b8')
        : (COLORS.button?.outlineText || COLORS.primary);
    }
    if (variant === 'primary') {
      return COLORS.button?.text || '#ffffff';
    }
    if (variant === 'secondary') {
      return COLORS.button?.secondaryText || '#ffffff';
    }
    if (variant === 'danger') {
      return COLORS.button?.dangerText || '#ffffff';
    }
    return COLORS.button?.text || '#ffffff';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        styles[size],
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && styles.outlineBorder,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`${size}Text`], { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  outlineBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.button?.outlineBorder || COLORS.primary,
  },
  text: {
    fontWeight: '700',
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 17,
  },
});
