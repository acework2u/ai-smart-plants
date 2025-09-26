import { Platform } from 'react-native';

// Light theme colors - AI Smart Plants Design System
export const lightColors = {
  // Brand colors
  primary: '#16a34a', // green-600
  primarySoft: '#dcfce7', // green-100
  primaryDark: '#166534', // green-800
  primaryLight: '#4ade80', // green-400

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Flat gray properties for easier access
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

  // Semantic colors
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500

  // Plant health status colors
  healthy: '#10b981', // emerald-500
  warningStatus: '#f59e0b', // amber-500
  critical: '#ef4444', // red-500

  // Background variations
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb', // gray-50
    tertiary: '#f3f4f6', // gray-100
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },

  // Surface colors
  surface: {
    primary: '#ffffff',
    elevated: '#ffffff',
    disabled: '#f3f4f6',
  },

  // Border colors
  border: {
    light: '#e5e7eb', // gray-200
    medium: '#d1d5db', // gray-300
    dark: '#9ca3af', // gray-400
  },

  // Text colors
  text: {
    primary: '#111827', // gray-900
    secondary: '#374151', // gray-700
    tertiary: '#6b7280', // gray-500
    disabled: '#9ca3af', // gray-400
    inverse: '#ffffff',
    link: '#3b82f6', // blue-500
  },

  // Activity colors (Thai plant care activities)
  activity: {
    'รดน้ำ': '#3b82f6', // blue-500
    'ใส่ปุ๋ย': '#10b981', // emerald-500
    'พ่นยา': '#f59e0b', // amber-500
    'ย้ายกระถาง': '#8b5cf6', // violet-500
    'ตรวจใบ': '#6b7280', // gray-500
  },

  // Notification colors
  notification: {
    reminder: '#3b82f6', // blue-500
    ai: '#8b5cf6', // violet-500
    alert: '#f59e0b', // amber-500
    achievement: '#10b981', // emerald-500
    system: '#6b7280', // gray-500
  },
};

// Dark theme colors - maintaining green accent
export const darkColors = {
  // Brand colors - keeping green accent bright for visibility
  primary: '#22c55e', // green-500 (brighter for dark mode)
  primarySoft: '#166534', // green-800 (darker version for backgrounds)
  primaryDark: '#15803d', // green-700
  primaryLight: '#4ade80', // green-400

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Gray scale - inverted for dark mode
  gray: {
    50: '#111827', // dark equivalent
    100: '#1f2937',
    200: '#374151',
    300: '#4b5563',
    400: '#6b7280',
    500: '#9ca3af',
    600: '#d1d5db',
    700: '#e5e7eb',
    800: '#f3f4f6',
    900: '#f9fafb',
  },

  // Semantic colors - adjusted for dark mode
  success: '#10b981', // emerald-500
  warning: '#fbbf24', // amber-400 (slightly brighter)
  error: '#f87171', // red-400 (slightly brighter)
  info: '#60a5fa', // blue-400 (slightly brighter)

  // Plant health status colors
  healthy: '#10b981', // emerald-500
  warningStatus: '#fbbf24', // amber-400
  critical: '#f87171', // red-400

  // Background variations - dark theme
  background: {
    primary: '#111827', // gray-900
    secondary: '#1f2937', // gray-800
    tertiary: '#374151', // gray-700
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },

  // Surface colors - dark theme
  surface: {
    primary: '#1f2937', // gray-800
    elevated: '#374151', // gray-700
    disabled: '#4b5563', // gray-600
  },

  // Border colors - dark theme
  border: {
    light: '#374151', // gray-700
    medium: '#4b5563', // gray-600
    dark: '#6b7280', // gray-500
  },

  // Text colors - dark theme
  text: {
    primary: '#f9fafb', // gray-50
    secondary: '#e5e7eb', // gray-200
    tertiary: '#d1d5db', // gray-300
    disabled: '#9ca3af', // gray-400
    inverse: '#111827', // gray-900
    link: '#60a5fa', // blue-400
  },

  // Activity colors (Thai plant care activities) - adjusted for dark mode
  activity: {
    'รดน้ำ': '#60a5fa', // blue-400
    'ใส่ปุ๋ย': '#10b981', // emerald-500
    'พ่นยา': '#fbbf24', // amber-400
    'ย้ายกระถาง': '#a78bfa', // violet-400
    'ตรวจใบ': '#9ca3af', // gray-400
  },

  // Notification colors - adjusted for dark mode
  notification: {
    reminder: '#60a5fa', // blue-400
    ai: '#a78bfa', // violet-400
    alert: '#fbbf24', // amber-400
    achievement: '#10b981', // emerald-500
    system: '#9ca3af', // gray-400
  },
};

// Legacy export for backward compatibility
export const colors = lightColors;

// Typography system
export const typography = {
  fontFamily: {
    regular: Platform.select({
      ios: 'SF Pro Text',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'SF Pro Text Medium',
      android: 'Roboto Medium',
      default: 'System',
    }),
    semibold: Platform.select({
      ios: 'SF Pro Text Semibold',
      android: 'Roboto Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'SF Pro Text Bold',
      android: 'Roboto Bold',
      default: 'System',
    }),
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Legacy spacing object (preserved for backward compatibility where needed)
const legacySpacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

// Spacing utility function - this is now the main spacing function
export const spacing = (multiplier: number): number => {
  const spacingMap = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  };
  return spacingMap[multiplier as keyof typeof spacingMap] || multiplier * 4;
};

// Legacy spacing object for backward compatibility
export const spacingMap = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

// Backward compatibility alias
export const getSpacing = spacing;

// Border radius
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 999,
};

// Shadow system
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 8,
  },
};

// Component sizes
export const sizes = {
  button: {
    sm: { height: 36, paddingHorizontal: 12 }, // spacing(3)
    md: { height: 44, paddingHorizontal: 16 }, // spacing(4)
    lg: { height: 52, paddingHorizontal: 24 }, // spacing(6)
  },
  input: {
    sm: { height: 36, paddingHorizontal: 12 }, // spacing(3)
    md: { height: 44, paddingHorizontal: 16 }, // spacing(4)
    lg: { height: 52, paddingHorizontal: 16 }, // spacing(4)
  },
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },
};

// Animation timing
export const animation = {
  fast: 200,
  normal: 300,
  slow: 500,
  extraSlow: 1000,
};

// Z-index layers
export const zIndex = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Breakpoints (for responsive design)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Theme interface
export interface Theme {
  colors: typeof lightColors;
  typography: typeof typography;
  spacing: typeof spacing; // This is now the spacing function
  spacingMap: typeof spacingMap; // Legacy spacing object
  radius: typeof radius;
  shadows: typeof shadows;
  sizes: typeof sizes;
  animation: typeof animation;
  zIndex: typeof zIndex;
  breakpoints: typeof breakpoints;
  componentStyles: {
    button: any;
    card: any;
    input: any;
    chip: any;
  };
}

// Create themed component styles
const createComponentStyles = (colors: typeof lightColors) => ({
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface.primary,
      borderColor: colors.border.light,
    },
    ghost: {
      backgroundColor: colors.transparent,
      borderColor: colors.transparent,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
  },

  card: {
    default: {
      backgroundColor: colors.surface.primary,
      borderColor: colors.border.light,
      borderRadius: radius.lg,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: colors.surface.elevated,
      borderColor: colors.border.light,
      borderRadius: radius.lg,
      ...shadows.md,
    },
  },

  input: {
    default: {
      backgroundColor: colors.surface.primary,
      borderColor: colors.border.light,
      borderRadius: radius.md,
    },
    focused: {
      borderColor: colors.primary,
    },
    error: {
      borderColor: colors.error,
    },
  },

  chip: {
    healthy: {
      backgroundColor: colors.success + '20', // 20% opacity
      color: colors.success,
    },
    warning: {
      backgroundColor: colors.warning + '20',
      color: colors.warning,
    },
    critical: {
      backgroundColor: colors.error + '20',
      color: colors.error,
    },
  },
});

// Light theme
export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  spacingMap,
  radius,
  shadows,
  sizes,
  animation,
  zIndex,
  breakpoints,
  componentStyles: createComponentStyles(lightColors),
};

// Dark theme
export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  spacingMap,
  radius,
  shadows,
  sizes,
  animation,
  zIndex,
  breakpoints,
  componentStyles: createComponentStyles(darkColors),
};

// Legacy exports for backward compatibility
export const theme = lightTheme;
export const componentStyles = lightTheme.componentStyles;

// Utility functions for working with theme
export const themeUtils = {
  // Get color with opacity
  withOpacity: (color: string, opacity: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Get spacing value (now just aliases the main spacing function)
  getSpacing: spacing,

  // Get responsive value based on screen width
  responsive: <T>(screenWidth: number, values: { sm?: T; md?: T; lg?: T; xl?: T; default: T }): T => {
    if (screenWidth >= breakpoints.xl && values.xl) return values.xl;
    if (screenWidth >= breakpoints.lg && values.lg) return values.lg;
    if (screenWidth >= breakpoints.md && values.md) return values.md;
    if (screenWidth >= breakpoints.sm && values.sm) return values.sm;
    return values.default;
  },

  // Get activity color
  getActivityColor: (activityKind: string): string => {
    return lightColors.activity[activityKind as keyof typeof lightColors.activity] || lightColors.gray[500];
  },

  // Get status color
  getStatusColor: (status: 'Healthy' | 'Warning' | 'Critical'): string => {
    const statusMap = {
      'Healthy': lightColors.healthy,
      'Warning': lightColors.warningStatus,
      'Critical': lightColors.critical,
    };
    return statusMap[status] || lightColors.gray[500];
  },

  // Get notification color
  getNotificationColor: (type: string): string => {
    return lightColors.notification[type as keyof typeof lightColors.notification] || lightColors.gray[500];
  },

  // Platform-specific styles
  platform: <T>(styles: { ios?: T; android?: T; default: T }): T => {
    if (Platform.OS === 'ios' && styles.ios) return styles.ios;
    if (Platform.OS === 'android' && styles.android) return styles.android;
    return styles.default;
  },
};

// Export default theme
export default theme;