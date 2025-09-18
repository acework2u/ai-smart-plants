// Central export file for all types
export * from './garden';
export * from './activity';
export * from './notifications';
export * from './ai';
export * from './weather';

// Common utility types
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface AppState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UserPreferences {
  language: 'th' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  haptics: boolean;
  units: {
    volume: 'ml' | 'ล.';
    weight: 'g' | 'kg';
    temperature: 'celsius' | 'fahrenheit';
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
    personalizedTips: boolean;
  };
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model?: string;
  screenWidth: number;
  screenHeight: number;
  hasCamera: boolean;
  hasNotifications: boolean;
  timezone: string;
}

export interface AppConfig {
  apiUrl: string;
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    aiAnalysis: boolean;
    socialFeatures: boolean;
    premiumFeatures: boolean;
    debugMode: boolean;
  };
  limits: {
    maxPlants: number;
    maxPhotos: number;
    maxActivitiesPerDay: number;
  };
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, permission: string) {
    super(message, 'PERMISSION_ERROR', 403, { permission });
    this.name = 'PermissionError';
  }
}

// Storage keys constants
export const STORAGE_KEYS = {
  PLANTS: '@spa/plants',
  ACTIVITIES: '@spa/activities',
  NOTIFICATIONS: '@spa/notifications',
  ONBOARDING_SEEN: '@spa/onboardingSeen',
  NOTIFICATION_FILTER: '@spa/notiFilter',
  PLANT_PREFS: '@spa/plantPrefs',
  USER_PREFERENCES: '@spa/userPrefs',
  PLANT_PREFS_PREFIX: '@spa/plantPrefs:',
  ANALYSIS_CACHE: '@spa/analysisCache',
  APP_STATE: '@spa/appState',
} as const;

// Deep linking routes
export const ROUTES = {
  ONBOARDING: '/onboarding',
  HOME: '/',
  ANALYZING: '/analyzing',
  RESULT: '/result',
  GARDEN: '/(tabs)/garden',
  PLANT_DETAIL: '/plant/[id]',
  ACTIVITY_LOG: '/activity/[id]',
  NOTIFICATIONS: '/(tabs)/notifications',
  INSIGHTS: '/(tabs)/insights',
  SETTINGS: '/(tabs)/settings',
} as const;

// Theme colors and design tokens
export const THEME = {
  colors: {
    primary: '#16a34a',
    primarySoft: '#dcfce7',
    primaryDark: '#166534',
    white: '#ffffff',
    black: '#000000',
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
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;

// Animation durations
export const ANIMATION = {
  fast: 200,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 400,
  },
} as const;

// Haptic feedback types
export const HAPTIC_TYPES = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'success',
  warning: 'warning',
  error: 'error',
  selection: 'selection',
} as const;

export type HapticType = keyof typeof HAPTIC_TYPES;
