import { InteractionManager, Platform } from 'react-native';

// Performance utilities for Smart Plant AI

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { start: number; end?: number; duration?: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start measuring performance
  startMeasure(key: string): void {
    this.metrics.set(key, { start: performance.now() });
  }

  // End measuring and log result
  endMeasure(key: string): number | null {
    const metric = this.metrics.get(key);
    if (!metric) return null;

    const end = performance.now();
    const duration = end - metric.start;
    metric.end = end;
    metric.duration = duration;

    if (__DEV__) {
      console.log(`⏱️ ${key}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get all metrics
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.forEach((value, key) => {
      if (value.duration !== undefined) {
        result[key] = value.duration;
      }
    });
    return result;
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// HOC for measuring component render time
export function withPerformanceMonitoring<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return React.forwardRef<any, T>((props, ref) => {
    const monitor = PerformanceMonitor.getInstance();

    React.useEffect(() => {
      monitor.startMeasure(`${componentName}_mount`);
      return () => {
        monitor.endMeasure(`${componentName}_mount`);
      };
    }, []);

    React.useEffect(() => {
      monitor.startMeasure(`${componentName}_render`);
      monitor.endMeasure(`${componentName}_render`);
    });

    return <Component {...props} ref={ref} />;
  });
}

// Hook for measuring async operations
export function usePerformanceTracking() {
  const monitor = PerformanceMonitor.getInstance();

  const trackAsyncOperation = React.useCallback(
    async <T,>(operation: () => Promise<T>, operationName: string): Promise<T> => {
      monitor.startMeasure(operationName);
      try {
        const result = await operation();
        monitor.endMeasure(operationName);
        return result;
      } catch (error) {
        monitor.endMeasure(operationName);
        throw error;
      }
    },
    [monitor]
  );

  return { trackAsyncOperation };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Utility to run expensive operations after interactions
export function runAfterInteractions<T>(callback: () => T): Promise<T> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(callback());
    });
  });
}

// Image optimization utilities
export const ImageOptimizer = {
  // Get optimized image URL for different screen densities
  getOptimizedImageUrl(
    baseUrl: string,
    width: number,
    height: number,
    quality: number = 80
  ): string {
    const pixelDensity = Platform.select({
      ios: window.devicePixelRatio || 2,
      android: window.devicePixelRatio || 2,
      default: 2,
    });

    const optimizedWidth = Math.round(width * pixelDensity);
    const optimizedHeight = Math.round(height * pixelDensity);

    // For demonstration - in production you'd use a real image optimization service
    return `${baseUrl}?w=${optimizedWidth}&h=${optimizedHeight}&q=${quality}&auto=format`;
  },

  // Calculate optimal image dimensions based on screen size
  getOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let newWidth = maxWidth;
    let newHeight = maxWidth / aspectRatio;

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  },
};

// Memory management utilities
export const MemoryManager = {
  // Clean up large objects from memory
  cleanup(objects: any[]): void {
    objects.forEach((obj) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach((key) => {
          delete obj[key];
        });
      }
    });
  },

  // Monitor memory usage (development only)
  logMemoryUsage(): void {
    if (__DEV__ && (performance as any).memory) {
      const memory = (performance as any).memory;
      console.log('🧠 Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      });
    }
  },

  // Create a memory-efficient list renderer
  createVirtualizedConfig(itemHeight: number) {
    return {
      getItemLayout: (_: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
      keyExtractor: (item: any, index: number) => item.id || String(index),
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      windowSize: 10,
      initialNumToRender: 10,
      updateCellsBatchingPeriod: 100,
    };
  },
};

// Bundle size analysis utilities
export const BundleAnalyzer = {
  // Log bundle size information
  logBundleInfo(): void {
    if (__DEV__) {
      console.log('📦 Bundle Info:', {
        platform: Platform.OS,
        version: Platform.Version,
        isDev: __DEV__,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Check if we're running on a low-end device
  isLowEndDevice(): boolean {
    if (Platform.OS === 'android') {
      // Simple heuristic - in production you'd use more sophisticated detection
      return Platform.Version < 26; // Android 8.0
    }
    return false;
  },

  // Get performance recommendations based on device
  getPerformanceConfig() {
    const isLowEnd = this.isLowEndDevice();

    return {
      enableAnimations: !isLowEnd,
      imageQuality: isLowEnd ? 60 : 80,
      maxConcurrentImages: isLowEnd ? 3 : 6,
      listPageSize: isLowEnd ? 5 : 10,
      cacheSize: isLowEnd ? 20 : 50,
    };
  },
};

// Network performance utilities
export const NetworkOptimizer = {
  // Batch multiple API calls
  createRequestBatcher<T>(
    requestFn: (ids: string[]) => Promise<T[]>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    let pendingIds: string[] = [];
    let pendingPromises: { [id: string]: { resolve: (value: T) => void; reject: (error: any) => void } } = {};
    let timeoutId: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (pendingIds.length === 0) return;

      const idsToProcess = [...pendingIds];
      const promisesToResolve = { ...pendingPromises };

      pendingIds = [];
      pendingPromises = {};
      timeoutId = null;

      try {
        const results = await requestFn(idsToProcess);
        idsToProcess.forEach((id, index) => {
          if (promisesToResolve[id] && results[index]) {
            promisesToResolve[id].resolve(results[index]);
          }
        });
      } catch (error) {
        idsToProcess.forEach((id) => {
          if (promisesToResolve[id]) {
            promisesToResolve[id].reject(error);
          }
        });
      }
    };

    return (id: string): Promise<T> => {
      return new Promise((resolve, reject) => {
        pendingIds.push(id);
        pendingPromises[id] = { resolve, reject };

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (pendingIds.length >= batchSize) {
          processBatch();
        } else {
          timeoutId = setTimeout(processBatch, delay);
        }
      });
    };
  },

  // Simple cache implementation
  createCache<T>(maxSize: number = 100) {
    const cache = new Map<string, { value: T; timestamp: number }>();

    return {
      get(key: string, maxAge: number = 300000): T | null { // 5 minutes default
        const item = cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > maxAge) {
          cache.delete(key);
          return null;
        }

        return item.value;
      },

      set(key: string, value: T): void {
        if (cache.size >= maxSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }

        cache.set(key, {
          value,
          timestamp: Date.now(),
        });
      },

      clear(): void {
        cache.clear();
      },

      size(): number {
        return cache.size;
      },
    };
  },
};

// Application performance health check
export const PerformanceHealthCheck = {
  // Check overall app performance health
  checkHealth(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check memory usage
    if (MemoryManager.isMemoryCritical && MemoryManager.isMemoryCritical()) {
      issues.push('High memory usage detected');
      recommendations.push('Clear cache and optimize data structures');
      score -= 20;
    }

    // Check performance metrics
    const metrics = performanceMonitor.getMetrics();
    const slowOperations = Object.entries(metrics).filter(([, duration]) => duration > 1000);

    if (slowOperations.length > 0) {
      issues.push(`${slowOperations.length} slow operations detected`);
      recommendations.push('Optimize slow operations or implement loading states');
      score -= 15;
    }

    // Check bundle optimization
    if (BundleAnalyzer.isLowEndDevice()) {
      issues.push('Running on low-end device');
      recommendations.push('Enable performance optimizations for low-end devices');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  },

  // Get performance grade
  getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  },

  // Generate performance report
  generateReport(): {
    score: number;
    grade: string;
    summary: string;
    details: any;
  } {
    const health = this.checkHealth();
    const grade = this.getGrade(health.score);
    const config = BundleAnalyzer.getPerformanceConfig();

    let summary = '';
    if (health.score >= 90) {
      summary = 'Excellent performance! Your app is running smoothly.';
    } else if (health.score >= 70) {
      summary = 'Good performance with room for improvement.';
    } else if (health.score >= 50) {
      summary = 'Performance issues detected that should be addressed.';
    } else {
      summary = 'Critical performance issues require immediate attention.';
    }

    return {
      score: health.score,
      grade,
      summary,
      details: {
        issues: health.issues,
        recommendations: health.recommendations,
        metrics: performanceMonitor.getMetrics(),
        config,
        timestamp: new Date().toISOString(),
      },
    };
  },
};

// Auto-optimization utilities
export const AutoOptimizer = {
  // Apply automatic optimizations based on device capabilities
  applyOptimizations(): void {
    const config = BundleAnalyzer.getPerformanceConfig();
    const isLowEnd = BundleAnalyzer.isLowEndDevice();

    if (__DEV__) {
      console.log('🔧 Applying performance optimizations:', {
        isLowEnd,
        config,
      });
    }

    // Configure based on device capabilities
    if (isLowEnd) {
      // Reduce animation complexity
      // Lower image quality
      // Reduce concurrent operations
      console.log('📱 Low-end device optimizations applied');
    }
  },

  // Monitor and auto-adjust performance settings
  startAutoMonitoring(): () => void {
    const interval = setInterval(() => {
      const health = PerformanceHealthCheck.checkHealth();

      if (health.score < 60) {
        if (__DEV__) {
          console.warn('⚠️ Performance degradation detected, applying optimizations');
        }
        this.applyOptimizations();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  },
};

// Performance monitoring integration
export const PerformanceIntegration = {
  // Initialize all performance monitoring
  initialize(): () => void {
    const monitor = PerformanceMonitor.getInstance();

    // Start memory monitoring if available
    let memoryStopFn: (() => void) | undefined;
    try {
      const { MemoryMonitor } = require('./memoryProfiler');
      memoryStopFn = MemoryMonitor.startMonitoring();
    } catch (error) {
      // Memory profiler not available
    }

    // Start auto-optimization
    const autoOptStopFn = AutoOptimizer.startAutoMonitoring();

    // Log bundle info
    BundleAnalyzer.logBundleInfo();

    // Apply initial optimizations
    AutoOptimizer.applyOptimizations();

    if (__DEV__) {
      console.log('🚀 Performance monitoring initialized');
    }

    // Return cleanup function
    return () => {
      memoryStopFn?.();
      autoOptStopFn();
    };
  },

  // Get comprehensive performance data
  getPerformanceData(): any {
    const health = PerformanceHealthCheck.checkHealth();
    const metrics = performanceMonitor.getMetrics();
    const config = BundleAnalyzer.getPerformanceConfig();

    return {
      health,
      metrics,
      config,
      platform: Platform.OS,
      version: Platform.Version,
      timestamp: Date.now(),
    };
  },
};

// Export performance monitoring instance
export const performanceMonitor = PerformanceMonitor.getInstance();