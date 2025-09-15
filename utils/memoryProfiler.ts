import React from 'react';
import { Platform } from 'react-native';
import { performanceMonitor } from './performance';

// Memory profiling and leak detection utilities for Smart Plant AI

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  components: ComponentMemoryInfo[];
  stores: StoreMemoryInfo[];
  images: ImageMemoryInfo[];
}

export interface ComponentMemoryInfo {
  name: string;
  instances: number;
  estimatedSize: number;
}

export interface StoreMemoryInfo {
  name: string;
  size: number;
  items: number;
}

export interface ImageMemoryInfo {
  uri: string;
  size: number;
  cached: boolean;
}

export interface MemoryLeak {
  type: 'component' | 'store' | 'image' | 'general';
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
  affectedObjects: string[];
}

export class MemoryProfiler {
  private static instance: MemoryProfiler;
  private snapshots: MemorySnapshot[] = [];
  private componentRegistry = new Map<string, WeakSet<any>>();
  private maxSnapshots = 50;
  private leakThresholds = {
    componentInstances: 100,
    storeSize: 10 * 1024 * 1024, // 10MB
    imageCache: 50 * 1024 * 1024, // 50MB
    heapGrowth: 5 * 1024 * 1024, // 5MB growth per minute
  };

  static getInstance(): MemoryProfiler {
    if (!MemoryProfiler.instance) {
      MemoryProfiler.instance = new MemoryProfiler();
    }
    return MemoryProfiler.instance;
  }

  // Take a memory snapshot
  takeSnapshot(): MemorySnapshot {
    const now = Date.now();

    const snapshot: MemorySnapshot = {
      timestamp: now,
      usedJSHeapSize: this.getUsedHeapSize(),
      totalJSHeapSize: this.getTotalHeapSize(),
      jsHeapSizeLimit: this.getHeapSizeLimit(),
      components: this.getComponentMemoryInfo(),
      stores: this.getStoreMemoryInfo(),
      images: this.getImageMemoryInfo(),
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    if (__DEV__) {
      console.log('📸 Memory snapshot taken:', {
        heap: `${Math.round(snapshot.usedJSHeapSize / 1024 / 1024)}MB`,
        components: snapshot.components.length,
        stores: snapshot.stores.length,
        images: snapshot.images.length,
      });
    }

    return snapshot;
  }

  // Register component for tracking
  registerComponent(componentName: string, instance: any): void {
    if (!this.componentRegistry.has(componentName)) {
      this.componentRegistry.set(componentName, new WeakSet());
    }
    this.componentRegistry.get(componentName)!.add(instance);
  }

  // Unregister component
  unregisterComponent(componentName: string, instance: any): void {
    const set = this.componentRegistry.get(componentName);
    if (set) {
      set.delete(instance);
    }
  }

  // Detect memory leaks
  detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    if (this.snapshots.length < 2) {
      return leaks;
    }

    const latest = this.snapshots[this.snapshots.length - 1];
    const previous = this.snapshots[this.snapshots.length - 2];

    // Check heap growth
    const heapGrowth = latest.usedJSHeapSize - previous.usedJSHeapSize;
    const timeDiff = latest.timestamp - previous.timestamp;
    const growthRate = (heapGrowth / timeDiff) * 60000; // per minute

    if (growthRate > this.leakThresholds.heapGrowth) {
      leaks.push({
        type: 'general',
        description: `Heap growing rapidly: ${Math.round(growthRate / 1024 / 1024)}MB/min`,
        severity: growthRate > this.leakThresholds.heapGrowth * 2 ? 'high' : 'medium',
        recommendation: 'Check for lingering references and cleanup issues',
        affectedObjects: ['JavaScript Heap'],
      });
    }

    // Check component instances
    latest.components.forEach(comp => {
      if (comp.instances > this.leakThresholds.componentInstances) {
        leaks.push({
          type: 'component',
          description: `Too many ${comp.name} instances: ${comp.instances}`,
          severity: comp.instances > this.leakThresholds.componentInstances * 2 ? 'high' : 'medium',
          recommendation: 'Check for missing cleanup in useEffect or memo issues',
          affectedObjects: [comp.name],
        });
      }
    });

    // Check store sizes
    latest.stores.forEach(store => {
      if (store.size > this.leakThresholds.storeSize) {
        leaks.push({
          type: 'store',
          description: `Large store detected: ${store.name} (${Math.round(store.size / 1024 / 1024)}MB)`,
          severity: store.size > this.leakThresholds.storeSize * 2 ? 'high' : 'medium',
          recommendation: 'Consider pagination or data cleanup for this store',
          affectedObjects: [store.name],
        });
      }
    });

    // Check image cache
    const totalImageSize = latest.images.reduce((sum, img) => sum + img.size, 0);
    if (totalImageSize > this.leakThresholds.imageCache) {
      leaks.push({
        type: 'image',
        description: `Image cache too large: ${Math.round(totalImageSize / 1024 / 1024)}MB`,
        severity: totalImageSize > this.leakThresholds.imageCache * 2 ? 'high' : 'medium',
        recommendation: 'Implement image cache eviction or reduce image sizes',
        affectedObjects: latest.images.map(img => img.uri),
      });
    }

    return leaks;
  }

  // Get memory usage trend
  getMemoryTrend(minutes: number = 10): {
    timestamps: number[];
    heapUsage: number[];
    componentCounts: number[];
    trend: 'increasing' | 'stable' | 'decreasing';
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentSnapshots = this.snapshots.filter(s => s.timestamp > cutoff);

    if (recentSnapshots.length < 2) {
      return {
        timestamps: [],
        heapUsage: [],
        componentCounts: [],
        trend: 'stable',
      };
    }

    const timestamps = recentSnapshots.map(s => s.timestamp);
    const heapUsage = recentSnapshots.map(s => s.usedJSHeapSize);
    const componentCounts = recentSnapshots.map(s =>
      s.components.reduce((sum, c) => sum + c.instances, 0)
    );

    // Determine trend
    const firstHeap = heapUsage[0];
    const lastHeap = heapUsage[heapUsage.length - 1];
    const growth = lastHeap - firstHeap;
    const growthPercentage = (growth / firstHeap) * 100;

    let trend: 'increasing' | 'stable' | 'decreasing';
    if (growthPercentage > 10) {
      trend = 'increasing';
    } else if (growthPercentage < -10) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return { timestamps, heapUsage, componentCounts, trend };
  }

  // Force garbage collection (development only)
  forceGC(): void {
    if (__DEV__ && global.gc) {
      global.gc();
      console.log('🗑️ Forced garbage collection');
    }
  }

  // Get current memory stats
  getCurrentStats(): {
    heap: { used: number; total: number; limit: number };
    components: number;
    stores: number;
    images: number;
  } {
    const latest = this.snapshots[this.snapshots.length - 1];

    return {
      heap: {
        used: this.getUsedHeapSize(),
        total: this.getTotalHeapSize(),
        limit: this.getHeapSizeLimit(),
      },
      components: latest?.components.length || 0,
      stores: latest?.stores.length || 0,
      images: latest?.images.length || 0,
    };
  }

  // Clear old snapshots
  clearSnapshots(): void {
    this.snapshots = [];
    console.log('🧹 Memory snapshots cleared');
  }

  // Generate memory report
  generateReport(): {
    summary: any;
    leaks: MemoryLeak[];
    trend: any;
    recommendations: string[];
  } {
    const leaks = this.detectLeaks();
    const trend = this.getMemoryTrend();
    const stats = this.getCurrentStats();

    const recommendations: string[] = [];

    if (trend.trend === 'increasing') {
      recommendations.push('Memory usage is increasing - check for leaks');
    }

    if (stats.heap.used / stats.heap.limit > 0.8) {
      recommendations.push('Heap usage is high - consider cleanup');
    }

    if (leaks.length > 0) {
      recommendations.push(`${leaks.length} potential leaks detected`);
    }

    if (stats.components > 50) {
      recommendations.push('High component count - check for unnecessary renders');
    }

    return {
      summary: {
        heapUsage: `${Math.round(stats.heap.used / 1024 / 1024)}MB / ${Math.round(stats.heap.limit / 1024 / 1024)}MB`,
        trend: trend.trend,
        leakCount: leaks.length,
        componentCount: stats.components,
      },
      leaks,
      trend,
      recommendations,
    };
  }

  // Private helper methods
  private getUsedHeapSize(): number {
    if (Platform.OS === 'web' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Fallback estimation for mobile
    return 0;
  }

  private getTotalHeapSize(): number {
    if (Platform.OS === 'web' && (performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }

  private getHeapSizeLimit(): number {
    if (Platform.OS === 'web' && (performance as any).memory) {
      return (performance as any).memory.jsHeapSizeLimit;
    }
    return 0;
  }

  private getComponentMemoryInfo(): ComponentMemoryInfo[] {
    const components: ComponentMemoryInfo[] = [];

    this.componentRegistry.forEach((weakSet, name) => {
      // Note: WeakSet doesn't expose size, so we estimate
      components.push({
        name,
        instances: 1, // Simplified - in real implementation we'd track this better
        estimatedSize: 1024, // Estimated per component
      });
    });

    return components;
  }

  private getStoreMemoryInfo(): StoreMemoryInfo[] {
    // In a real implementation, we'd integrate with actual stores
    return [
      { name: 'GardenStore', size: 1024 * 100, items: 10 },
      { name: 'ActivityStore', size: 1024 * 200, items: 50 },
      { name: 'NotificationStore', size: 1024 * 50, items: 20 },
    ];
  }

  private getImageMemoryInfo(): ImageMemoryInfo[] {
    // In a real implementation, we'd track actual image cache
    return [];
  }
}

// React hook for memory profiling
export function useMemoryProfiler() {
  const profiler = MemoryProfiler.getInstance();

  const React = require('react');

  const [stats, setStats] = React.useState(() => profiler.getCurrentStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      profiler.takeSnapshot();
      setStats(profiler.getCurrentStats());
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const detectLeaks = React.useCallback(() => {
    return profiler.detectLeaks();
  }, []);

  const generateReport = React.useCallback(() => {
    return profiler.generateReport();
  }, []);

  const forceGC = React.useCallback(() => {
    profiler.forceGC();
  }, []);

  return {
    stats,
    detectLeaks,
    generateReport,
    forceGC,
    takeSnapshot: () => profiler.takeSnapshot(),
    clearSnapshots: () => profiler.clearSnapshots(),
  };
}

// HOC for component memory tracking
export function withMemoryTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return React.forwardRef<any, T>((props, ref) => {
    const profiler = MemoryProfiler.getInstance();
    const instanceRef = React.useRef({});

    React.useEffect(() => {
      profiler.registerComponent(componentName, instanceRef.current);

      return () => {
        profiler.unregisterComponent(componentName, instanceRef.current);
      };
    }, []);

    return React.createElement(Component, { ...props, ref });
  });
}

// Memory monitoring utilities
export const MemoryMonitor = {
  // Start continuous monitoring
  startMonitoring(intervalMs: number = 30000): () => void {
    const profiler = MemoryProfiler.getInstance();

    const interval = setInterval(() => {
      profiler.takeSnapshot();

      const leaks = profiler.detectLeaks();
      if (leaks.length > 0 && __DEV__) {
        console.warn('⚠️ Memory leaks detected:', leaks);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  },

  // Log memory stats
  logStats(): void {
    const profiler = MemoryProfiler.getInstance();
    const report = profiler.generateReport();

    console.log('📊 Memory Report:', report);
  },

  // Check if memory usage is critical
  isMemoryCritical(): boolean {
    const profiler = MemoryProfiler.getInstance();
    const stats = profiler.getCurrentStats();

    return stats.heap.used / stats.heap.limit > 0.9;
  },

  // Get memory optimization suggestions
  getOptimizationSuggestions(): string[] {
    const profiler = MemoryProfiler.getInstance();
    const report = profiler.generateReport();

    return report.recommendations;
  },
};

// Export the singleton instance
export const memoryProfiler = MemoryProfiler.getInstance();