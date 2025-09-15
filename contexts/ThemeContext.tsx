import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as lightColors } from '../core/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primarySoft: string;

  // Background colors
  background: string;
  surface: string;
  card: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Neutral colors
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;

  // Border and divider
  border: string;
  divider: string;

  // Interactive elements
  ripple: string;
  overlay: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

const lightTheme: Theme = {
  colors: {
    primary: '#16a34a',
    primarySoft: '#dcfce7',

    background: '#ffffff',
    surface: '#ffffff',
    card: '#ffffff',

    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6b7280',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    white: '#ffffff',
    black: '#000000',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',

    border: '#e5e7eb',
    divider: '#f3f4f6',

    ripple: 'rgba(22, 163, 74, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  isDark: false,
};

const darkTheme: Theme = {
  colors: {
    primary: '#22c55e',
    primarySoft: '#14532d',

    background: '#0f1419',
    surface: '#1f2937',
    card: '#374151',

    text: '#f9fafb',
    textSecondary: '#e5e7eb',
    textMuted: '#9ca3af',

    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    white: '#ffffff',
    black: '#000000',
    gray50: '#1f2937',
    gray100: '#374151',
    gray200: '#4b5563',
    gray300: '#6b7280',
    gray400: '#9ca3af',
    gray500: '#d1d5db',
    gray600: '#e5e7eb',
    gray700: '#f3f4f6',
    gray800: '#f9fafb',
    gray900: '#ffffff',

    border: '#4b5563',
    divider: '#374151',

    ripple: 'rgba(34, 197, 94, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isSystemDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@spa/themeMode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Determine if we should use dark theme
  const isSystemDark = systemColorScheme === 'dark';
  const shouldUseDarkTheme =
    themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

  const theme = shouldUseDarkTheme ? darkTheme : lightTheme;

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = shouldUseDarkTheme ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isSystemDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for getting colors
export const useColors = (): ThemeColors => {
  const { theme } = useTheme();
  return theme.colors;
};

// Helper function to create themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  styleFunction: (theme: Theme) => T
) => {
  return (theme: Theme) => styleFunction(theme);
};

// Utility function to get appropriate color for current theme
export const getThemeColor = (
  lightColor: string,
  darkColor: string,
  isDark: boolean
): string => {
  return isDark ? darkColor : lightColor;
};