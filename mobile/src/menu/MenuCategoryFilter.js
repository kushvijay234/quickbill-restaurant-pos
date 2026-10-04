import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

export const MenuCategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <TouchableOpacity
            key={cat}
            activeOpacity={0.7}
            onPress={() => onSelectCategory(cat)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? COLORS.primary
                  : isDark
                  ? colors.surfaceSubtle
                  : '#ffffff',
                borderColor: isSelected ? COLORS.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: isSelected ? '#ffffff' : colors.textSecondary,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
  },
});
