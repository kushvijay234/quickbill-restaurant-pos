import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const FastBilloLogo = ({
  size = 56,
  showBrandText = false,
  tagline = 'BILL FAST. GROW FASTER.',
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Square Green Logo Box with Bill Design and white FASTBILLO inside */}
      <View
        style={[
          styles.logoBox,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.22),
          },
        ]}
      >
        <Image
          source={require('../../../assets/icon.png')}
          style={{ width: size, height: size, borderRadius: Math.round(size * 0.22) }}
          resizeMode="contain"
        />
      </View>

      {showBrandText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandTitle, { color: colors.text, fontSize: Math.max(20, Math.round(size * 0.45)) }]}>
            FAST<Text style={{ color: '#16a34a' }}>BILLO</Text>
          </Text>
          {tagline ? (
            <Text style={styles.brandTagline}>
              {tagline}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 3,
  },
});

export default FastBilloLogo;
