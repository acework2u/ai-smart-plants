// Central export for all core modules
import { Platform, Dimensions } from 'react-native';
import { generateId as genId } from '../utils/ids';
export * from './theme';
export * from './haptics';

// Re-export theme as default for easy importing
export { default as theme } from './theme';
export { default as hapticService } from './haptics';

// Common utilities and constants
export const APP_CONFIG = {
  version: '1.0.0',
  buildNumber: '1',
  apiVersion: 'v1',
  environment: __DEV__ ? 'development' : 'production',

  // Feature flags
  features: {
    hapticFeedback: true,
    aiAnalysis: true,
    notifications: true,
    analytics: true,
    debugMode: __DEV__,
  },

  // App limits and constraints
  limits: {
    maxPlants: 50,
    maxPhotosPerPlant: 10,
    maxActivitiesPerDay: 20,
    cacheSize: 100, // MB
    imageQuality: 0.8,
    maxImageSize: 5 * 1024 * 1024, // 5MB
  },

  // Timing constants
  timing: {
    splashScreen: 2000,
    aiAnalysis: 2000,
    autoSave: 5000,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
    networkTimeout: 10000,
  },
};

// Device and platform utilities
export const platformUtils = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',

  // Get safe area insets (to be used with react-native-safe-area-context)
  getSafeAreaInsets: () => {
    // This will be populated by SafeAreaProvider
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  },

  // Get device dimensions
  getScreenDimensions: () => {
    const { width, height } = Dimensions.get('window');
    const screenData = Dimensions.get('screen');

    return {
      window: { width, height },
      screen: screenData,
      isLandscape: width > height,
      isTablet: width >= 768,
    };
  },

  // Check if device has certain capabilities
  getDeviceCapabilities: () => {
    return {
      hasCamera: true, // Will be determined by permissions
      hasNotifications: true, // Will be determined by permissions
      hasBiometrics: false, // Not implemented yet
      hasHaptics: Platform.OS === 'ios' || Platform.OS === 'android',
    };
  },
};

// Performance utilities
export const performanceUtils = {
  // Debounce function for input handling
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },

  // Throttle function for scroll/gesture handling
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  // Measure function execution time
  measureTime: <T>(name: string, func: () => T): T => {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${end - start}ms`);
    return result;
  },

  // Memory usage monitoring (development only)
  logMemoryUsage: () => {
    if (__DEV__ && (global as any).performance?.memory) {
      const memory = ((global as any).performance as any).memory;
      console.log(`[Memory] Used: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`);
      console.log(`[Memory] Total: ${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`);
      console.log(`[Memory] Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
    }
  },
};

// Error handling utilities
export const errorUtils = {
  // Create standardized error objects
  createError: (
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown
  ) => {
    const error = new Error(message) as any;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  },

  // Handle and format errors for user display
  formatErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      // Don't expose technical error messages to users
      const userFriendlyMessages: Record<string, string> = {
        'NETWORK_ERROR': 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้',
        'VALIDATION_ERROR': 'ข้อมูลไม่ถูกต้อง',
        'PERMISSION_ERROR': 'ไม่ได้รับอนุญาต',
        'CAMERA_ERROR': 'ไม่สามารถใช้กล้องได้',
        'STORAGE_ERROR': 'ไม่สามารถบันทึกข้อมูลได้',
      };

      const errorCode = (error as any).code;
      return userFriendlyMessages[errorCode] || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    }

    return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  },

  // Log errors for debugging (development) or analytics (production)
  logError: (error: unknown, context?: string) => {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      version: APP_CONFIG.version,
    };

    if (__DEV__) {
      console.error('[Error]', errorInfo);
    } else {
      // In production, send to analytics service
      // analytics.logError(errorInfo);
    }
  },
};

// Storage utilities
export const storageUtils = {
  // Generate unique IDs
  generateId: (): string => {
    return genId();
  },

  // Format dates for consistent storage
  formatDate: (date: Date): string => {
    return date.toISOString();
  },

  // Parse stored dates
  parseDate: (dateString: string): Date => {
    return new Date(dateString);
  },

  // Check if stored data is valid
  isValidStoredData: (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false;

    try {
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  },

  // Calculate storage size
  calculateStorageSize: (data: unknown): number => {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  },
};

// Development utilities
export const devUtils = {
  // Log app state for debugging
  logAppState: () => {
    if (__DEV__) {
      console.log('[App State]', {
        config: APP_CONFIG,
        platform: Platform,
        dimensions: platformUtils.getScreenDimensions(),
        capabilities: platformUtils.getDeviceCapabilities(),
      });
    }
  },

  // Performance monitoring
  startPerformanceMonitoring: () => {
    if (__DEV__) {
      setInterval(() => {
        performanceUtils.logMemoryUsage();
      }, 30000); // Log every 30 seconds
    }
  },

  // Feature flag testing
  enableFeature: (feature: keyof typeof APP_CONFIG.features) => {
    if (__DEV__) {
      APP_CONFIG.features[feature] = true;
      console.log(`[Dev] Feature enabled: ${feature}`);
    }
  },

  disableFeature: (feature: keyof typeof APP_CONFIG.features) => {
    if (__DEV__) {
      APP_CONFIG.features[feature] = false;
      console.log(`[Dev] Feature disabled: ${feature}`);
    }
  },
};

// Initialize core services
export const initializeCore = () => {
  if (__DEV__) {
    devUtils.logAppState();
    devUtils.startPerformanceMonitoring();
  }

  // Initialize haptic service with default config
  hapticService.configure({
    enabled: APP_CONFIG.features.hapticFeedback,
    intensity: 'medium',
  });

  console.log(`[Core] AI Smart Plants v${APP_CONFIG.version} initialized`);
};

// Add required imports that were missing
import { Platform, Dimensions } from 'react-native';
import { hapticService } from './haptics';
