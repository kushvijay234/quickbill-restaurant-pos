import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { COLORS } from '../constants/colors';
import { storageService } from '../services/storageService';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: COLORS.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    storageService.getThemeMode().then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      } else {
        setTheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    });
  }, [systemScheme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    storageService.setThemeMode(nextTheme);
  };

  const isDark = theme === 'dark';
  const activeColors = isDark ? COLORS.dark : COLORS.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: activeColors,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
