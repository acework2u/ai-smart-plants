import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InsightCacheEntry,
  InsightMetadata,
  InsightRequest,
  InsightResponse,
  TimeRange,
  ActivityFrequencyData,
  HealthTrendData,
  HealthDeclinePrediction,
  PlantHealthReport,
  SeasonalPattern,
  UserCareHabits,
  EngagementMetrics,
  ProductivityScore,
  PersonalizedTip,
  PlantPerformanceComparison,
  BenchmarkData,
  ImprovementArea,
  LineChartData,
  BarChartData,
  PieChartData,
  AggregatedMetrics,
  STORAGE_KEYS,
} from '../types';
import { insightsService } from '../services/insightsService';

/**
 * Insights Store with Advanced Caching and Performance Optimization
 *
 * Features:
 * - Intelligent caching with dependency tracking
 * - Automatic cache invalidation
 * - Background computation
 * - Performance monitoring
 * - Historical data storage
 * - Cache warming strategies
 */

interface InsightsState {
  // Cache storage
  cache: Record<string, InsightCacheEntry>;

  // Current computation state
  isLoading: boolean;
  loadingTasks: Set<string>;
  error: string | null;

  // Performance metrics
  performance: {
    totalComputations: number;
    averageComputationTime: number;
    cacheHitRate: number;
    lastOptimization: Date | null;
  };

  // Cache configuration
  config: {
    defaultCacheTTL: number; // milliseconds
    maxCacheSize: number; // number of entries
    enableBackgroundComputation: boolean;
    warmupOnLoad: boolean;
    compressionEnabled: boolean;
  };

  // Historical insights storage
  historical: {
    dailyMetrics: Record<string, AggregatedMetrics>; // date -> metrics
    weeklyTrends: Record<string, any>; // week -> trend data
    monthlyReports: Record<string, any>; // month -> report data
  };

  // Dependency tracking
  dependencies: {
    plantData: Date | null;
    activityData: Date | null;
    weatherData: Date | null;
    userPreferences: Date | null;
  };

  // Background tasks
  backgroundTasks: {
    warmupTasks: string[];
    scheduledComputations: Record<string, Date>;
    precomputeQueue: string[];
  };
}

interface InsightsActions {
  // Core insight retrieval
  getInsight: <T = any>(request: InsightRequest) => Promise<InsightResponse<T>>;

  // Specific insight getters with caching
  getActivityPatterns: (plantId?: string, forceRefresh?: boolean) => Promise<InsightResponse<ActivityFrequencyData[]>>;
  getHealthTrends: (plantId: string, forceRefresh?: boolean) => Promise<InsightResponse<HealthTrendData>>;
  getHealthPrediction: (plantId: string, forceRefresh?: boolean) => Promise<InsightResponse<HealthDeclinePrediction>>;
  getHealthReport: (plantId: string, forceRefresh?: boolean) => Promise<InsightResponse<PlantHealthReport>>;
  getSeasonalPatterns: (forceRefresh?: boolean) => Promise<InsightResponse<SeasonalPattern[]>>;
  getUserHabits: (forceRefresh?: boolean) => Promise<InsightResponse<UserCareHabits>>;
  getEngagementMetrics: (forceRefresh?: boolean) => Promise<InsightResponse<EngagementMetrics>>;
  getProductivityScore: (forceRefresh?: boolean) => Promise<InsightResponse<ProductivityScore>>;
  getPersonalizedTips: (plantId?: string, forceRefresh?: boolean) => Promise<InsightResponse<PersonalizedTip[]>>;
  getPlantComparison: (forceRefresh?: boolean) => Promise<InsightResponse<PlantPerformanceComparison[]>>;
  getBenchmarks: (forceRefresh?: boolean) => Promise<InsightResponse<BenchmarkData[]>>;
  getImprovementAreas: (forceRefresh?: boolean) => Promise<InsightResponse<ImprovementArea[]>>;

  // Chart data with caching
  getChartData: <T = LineChartData | BarChartData | PieChartData>(
    chartType: 'line' | 'bar' | 'pie',
    dataType: string,
    plantId?: string,
    forceRefresh?: boolean
  ) => Promise<InsightResponse<T>>;

  // Cache management
  clearCache: (pattern?: string) => void;
  invalidateCache: (dependencies: string[]) => void;
  precomputeInsights: (plantIds?: string[]) => Promise<void>;
  optimizeCache: () => Promise<void>;

  // Background processing
  startBackgroundTasks: () => void;
  stopBackgroundTasks: () => void;
  warmupCache: () => Promise<void>;
  scheduleComputation: (insightType: string, delay: number) => void;

  // Historical data management
  storeHistoricalData: (type: 'daily' | 'weekly' | 'monthly', data: any) => void;
  getHistoricalData: (type: 'daily' | 'weekly' | 'monthly', period: string) => any;
  cleanupHistoricalData: (olderThanDays: number) => void;

  // Performance monitoring
  recordPerformance: (computationTime: number, cacheHit: boolean) => void;
  getPerformanceReport: () => any;

  // Dependency updates
  updateDependency: (type: 'plantData' | 'activityData' | 'weatherData' | 'userPreferences') => void;

  // Configuration
  updateConfig: (config: Partial<InsightsState['config']>) => void;

  // Utility
  reset: () => void;
  clearError: () => void;
}

const initialState: InsightsState = {
  cache: {},
  isLoading: false,
  loadingTasks: new Set(),
  error: null,
  performance: {
    totalComputations: 0,
    averageComputationTime: 0,
    cacheHitRate: 0,
    lastOptimization: null,
  },
  config: {
    defaultCacheTTL: 10 * 60 * 1000, // 10 minutes
    maxCacheSize: 100,
    enableBackgroundComputation: true,
    warmupOnLoad: true,
    compressionEnabled: false,
  },
  historical: {
    dailyMetrics: {},
    weeklyTrends: {},
    monthlyReports: {},
  },
  dependencies: {
    plantData: null,
    activityData: null,
    weatherData: null,
    userPreferences: null,
  },
  backgroundTasks: {
    warmupTasks: [],
    scheduledComputations: {},
    precomputeQueue: [],
  },
};

export const useInsightsStore = create<InsightsState & InsightsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // ============================================================================
      // CORE INSIGHT RETRIEVAL
      // ============================================================================

      getInsight: async <T = any>(request: InsightRequest): Promise<InsightResponse<T>> => {
        const startTime = Date.now();
        const cacheKey = generateCacheKey(request);

        // Check cache first (unless forced refresh)
        if (!request.forceRefresh) {
          const cached = get().getCachedInsight<T>(cacheKey);
          if (cached) {
            get().recordPerformance(Date.now() - startTime, true);
            return {
              ...cached,
              cached: true,
              computationTime: Date.now() - startTime,
            };
          }
        }

        // Mark as loading
        set((state) => {
          state.isLoading = true;
          state.loadingTasks.add(cacheKey);
          state.error = null;
        });

        try {
          // Route to appropriate service method
          let result: InsightResponse<T>;

          switch (request.type) {
            case 'activity_patterns':
              result = await insightsService.analyzeActivityPatterns(request.plantId) as InsightResponse<T>;
              break;
            case 'health_trends':
              if (!request.plantId) throw new Error('Plant ID required for health trends');
              result = await insightsService.calculateHealthTrends(request.plantId) as InsightResponse<T>;
              break;
            case 'seasonal_patterns':
              result = await insightsService.getSeasonalPatterns() as InsightResponse<T>;
              break;
            case 'user_behavior':
              result = await insightsService.getUserCareHabits() as InsightResponse<T>;
              break;
            case 'comparative_analysis':
              result = await insightsService.comparePlantPerformance() as InsightResponse<T>;
              break;
            case 'personalized_tips':
              result = await insightsService.getPersonalizedTips() as InsightResponse<T>;
              break;
            default:
              throw new Error(`Unsupported insight type: ${request.type}`);
          }

          // Cache the result if successful
          if (result.success && result.data) {
            get().cacheInsight(cacheKey, result, request);
          }

          get().recordPerformance(Date.now() - startTime, false);
          return result;

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          set((state) => {
            state.error = errorMessage;
          });

          return {
            success: false,
            error: {
              code: 'COMPUTATION_ERROR',
              message: errorMessage,
            },
            cached: false,
            computationTime: Date.now() - startTime,
          };
        } finally {
          set((state) => {
            state.loadingTasks.delete(cacheKey);
            state.isLoading = state.loadingTasks.size > 0;
          });
        }
      },

      // ============================================================================
      // SPECIFIC INSIGHT GETTERS
      // ============================================================================

      getActivityPatterns: async (plantId?: string, forceRefresh = false) => {
        return get().getInsight<ActivityFrequencyData[]>({
          type: 'activity_patterns',
          plantId,
          forceRefresh,
        });
      },

      getHealthTrends: async (plantId: string, forceRefresh = false) => {
        return get().getInsight<HealthTrendData>({
          type: 'health_trends',
          plantId,
          forceRefresh,
        });
      },

      getHealthPrediction: async (plantId: string, forceRefresh = false) => {
        const cacheKey = `health_prediction_${plantId}`;

        if (!forceRefresh) {
          const cached = get().getCachedInsight<HealthDeclinePrediction>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.predictHealthDecline(plantId);
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'health_trends', plantId });
        }
        return result;
      },

      getHealthReport: async (plantId: string, forceRefresh = false) => {
        const cacheKey = `health_report_${plantId}`;

        if (!forceRefresh) {
          const cached = get().getCachedInsight<PlantHealthReport>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.generateHealthReport(plantId);
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'health_trends', plantId });
        }
        return result;
      },

      getSeasonalPatterns: async (forceRefresh = false) => {
        return get().getInsight<SeasonalPattern[]>({
          type: 'seasonal_patterns',
          forceRefresh,
        });
      },

      getUserHabits: async (forceRefresh = false) => {
        return get().getInsight<UserCareHabits>({
          type: 'user_behavior',
          forceRefresh,
        });
      },

      getEngagementMetrics: async (forceRefresh = false) => {
        const cacheKey = 'engagement_metrics';

        if (!forceRefresh) {
          const cached = get().getCachedInsight<EngagementMetrics>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.getEngagementMetrics();
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'user_behavior' });
        }
        return result;
      },

      getProductivityScore: async (forceRefresh = false) => {
        const cacheKey = 'productivity_score';

        if (!forceRefresh) {
          const cached = get().getCachedInsight<ProductivityScore>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.getProductivityScore();
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'user_behavior' });
        }
        return result;
      },

      getPersonalizedTips: async (plantId?: string, forceRefresh = false) => {
        return get().getInsight<PersonalizedTip[]>({
          type: 'personalized_tips',
          plantId,
          forceRefresh,
        });
      },

      getPlantComparison: async (forceRefresh = false) => {
        return get().getInsight<PlantPerformanceComparison[]>({
          type: 'comparative_analysis',
          forceRefresh,
        });
      },

      getBenchmarks: async (forceRefresh = false) => {
        const cacheKey = 'benchmark_data';

        if (!forceRefresh) {
          const cached = get().getCachedInsight<BenchmarkData[]>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.getBenchmarkData();
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'comparative_analysis' });
        }
        return result;
      },

      getImprovementAreas: async (forceRefresh = false) => {
        const cacheKey = 'improvement_areas';

        if (!forceRefresh) {
          const cached = get().getCachedInsight<ImprovementArea[]>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.getImprovementAreas();
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'comparative_analysis' });
        }
        return result;
      },

      // ============================================================================
      // CHART DATA WITH CACHING
      // ============================================================================

      getChartData: async <T = LineChartData | BarChartData | PieChartData>(
        chartType: 'line' | 'bar' | 'pie',
        dataType: string,
        plantId?: string,
        forceRefresh = false
      ): Promise<InsightResponse<T>> => {
        const cacheKey = `chart_${chartType}_${dataType}_${plantId || 'all'}`;

        if (!forceRefresh) {
          const cached = get().getCachedInsight<T>(cacheKey);
          if (cached) return { ...cached, cached: true, computationTime: 0 };
        }

        const result = await insightsService.generateChartData(chartType, dataType, plantId) as InsightResponse<T>;
        if (result.success) {
          get().cacheInsight(cacheKey, result, { type: 'activity_patterns', plantId });
        }
        return result;
      },

      // ============================================================================
      // CACHE MANAGEMENT
      // ============================================================================

      clearCache: (pattern?: string) => {
        set((state) => {
          if (pattern) {
            // Clear cache entries matching pattern
            Object.keys(state.cache).forEach(key => {
              if (key.includes(pattern)) {
                delete state.cache[key];
              }
            });
          } else {
            // Clear all cache
            state.cache = {};
          }
        });
      },

      invalidateCache: (dependencies: string[]) => {
        set((state) => {
          Object.keys(state.cache).forEach(key => {
            const entry = state.cache[key];
            if (entry.dependencies.some(dep => dependencies.includes(dep))) {
              delete state.cache[key];
            }
          });
        });
      },

      precomputeInsights: async (plantIds?: string[]) => {
        const { config } = get();
        if (!config.enableBackgroundComputation) return;

        // Common insights to precompute
        const tasks = [
          { type: 'activity_patterns', plantId: undefined },
          { type: 'user_behavior', plantId: undefined },
          { type: 'seasonal_patterns', plantId: undefined },
          { type: 'comparative_analysis', plantId: undefined },
        ];

        // Add plant-specific insights
        if (plantIds) {
          plantIds.forEach(plantId => {
            tasks.push(
              { type: 'health_trends', plantId },
              { type: 'personalized_tips', plantId }
            );
          });
        }

        // Execute precomputation in background
        Promise.all(
          tasks.map(task =>
            get().getInsight({
              type: task.type as any,
              plantId: task.plantId,
            }).catch(error => console.warn('Precomputation failed:', error))
          )
        );
      },

      optimizeCache: async () => {
        const state = get();
        const { config, cache } = state;
        const now = new Date();

        set((draft) => {
          // Remove expired entries
          Object.keys(cache).forEach(key => {
            if (cache[key].expiresAt < now) {
              delete draft.cache[key];
            }
          });

          // Remove oldest entries if cache is too large
          const cacheEntries = Object.entries(draft.cache);
          if (cacheEntries.length > config.maxCacheSize) {
            const sortedEntries = cacheEntries.sort((a, b) =>
              a[1].generatedAt.getTime() - b[1].generatedAt.getTime()
            );

            const toRemove = sortedEntries.slice(0, cacheEntries.length - config.maxCacheSize);
            toRemove.forEach(([key]) => {
              delete draft.cache[key];
            });
          }

          draft.performance.lastOptimization = now;
        });
      },

      // ============================================================================
      // BACKGROUND PROCESSING
      // ============================================================================

      startBackgroundTasks: () => {
        const state = get();
        if (!state.config.enableBackgroundComputation) return;

        // Schedule cache optimization
        const optimizationInterval = setInterval(() => {
          get().optimizeCache();
        }, 5 * 60 * 1000); // Every 5 minutes

        // Schedule precomputation
        const precomputeInterval = setInterval(() => {
          get().precomputeInsights();
        }, 15 * 60 * 1000); // Every 15 minutes

        // Store intervals for cleanup (in real app, would use proper cleanup)
        (global as any).__insightsIntervals = { optimizationInterval, precomputeInterval };
      },

      stopBackgroundTasks: () => {
        const intervals = (global as any).__insightsIntervals;
        if (intervals) {
          clearInterval(intervals.optimizationInterval);
          clearInterval(intervals.precomputeInterval);
          delete (global as any).__insightsIntervals;
        }
      },

      warmupCache: async () => {
        const commonInsights = [
          'activity_patterns',
          'user_behavior',
          'engagement_metrics',
          'productivity_score',
        ];

        await Promise.all(
          commonInsights.map(type =>
            get().getInsight({ type: type as any }).catch(error =>
              console.warn(`Cache warmup failed for ${type}:`, error)
            )
          )
        );
      },

      scheduleComputation: (insightType: string, delay: number) => {
        const executeAt = new Date(Date.now() + delay);

        set((state) => {
          state.backgroundTasks.scheduledComputations[insightType] = executeAt;
        });

        setTimeout(() => {
          get().getInsight({ type: insightType as any }).catch(error =>
            console.warn(`Scheduled computation failed for ${insightType}:`, error)
          );
        }, delay);
      },

      // ============================================================================
      // HISTORICAL DATA MANAGEMENT
      // ============================================================================

      storeHistoricalData: (type: 'daily' | 'weekly' | 'monthly', data: any) => {
        const key = new Date().toISOString().split('T')[0];

        set((state) => {
          switch (type) {
            case 'daily':
              state.historical.dailyMetrics[key] = data;
              break;
            case 'weekly':
              state.historical.weeklyTrends[key] = data;
              break;
            case 'monthly':
              state.historical.monthlyReports[key] = data;
              break;
          }
        });
      },

      getHistoricalData: (type: 'daily' | 'weekly' | 'monthly', period: string) => {
        const state = get();
        switch (type) {
          case 'daily':
            return state.historical.dailyMetrics[period];
          case 'weekly':
            return state.historical.weeklyTrends[period];
          case 'monthly':
            return state.historical.monthlyReports[period];
          default:
            return null;
        }
      },

      cleanupHistoricalData: (olderThanDays: number) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const cutoffString = cutoffDate.toISOString().split('T')[0];

        set((state) => {
          // Clean daily metrics
          Object.keys(state.historical.dailyMetrics).forEach(date => {
            if (date < cutoffString) {
              delete state.historical.dailyMetrics[date];
            }
          });

          // Clean weekly trends
          Object.keys(state.historical.weeklyTrends).forEach(date => {
            if (date < cutoffString) {
              delete state.historical.weeklyTrends[date];
            }
          });

          // Clean monthly reports (keep longer)
          const monthCutoff = new Date();
          monthCutoff.setMonth(monthCutoff.getMonth() - 6);
          const monthCutoffString = monthCutoff.toISOString().split('T')[0];

          Object.keys(state.historical.monthlyReports).forEach(date => {
            if (date < monthCutoffString) {
              delete state.historical.monthlyReports[date];
            }
          });
        });
      },

      // ============================================================================
      // PERFORMANCE MONITORING
      // ============================================================================

      recordPerformance: (computationTime: number, cacheHit: boolean) => {
        set((state) => {
          const perf = state.performance;
          const newTotal = perf.totalComputations + 1;

          // Update averages
          perf.averageComputationTime =
            (perf.averageComputationTime * perf.totalComputations + computationTime) / newTotal;

          // Update cache hit rate
          const hits = perf.cacheHitRate * perf.totalComputations + (cacheHit ? 1 : 0);
          perf.cacheHitRate = hits / newTotal;

          perf.totalComputations = newTotal;
        });
      },

      getPerformanceReport: () => {
        const state = get();
        const cacheSize = Object.keys(state.cache).length;
        const memoryUsage = JSON.stringify(state.cache).length; // Rough estimate

        return {
          ...state.performance,
          cacheSize,
          memoryUsage,
          backgroundTasksActive: Object.keys(state.backgroundTasks.scheduledComputations).length,
          historicalDataSize: {
            daily: Object.keys(state.historical.dailyMetrics).length,
            weekly: Object.keys(state.historical.weeklyTrends).length,
            monthly: Object.keys(state.historical.monthlyReports).length,
          },
        };
      },

      // ============================================================================
      // DEPENDENCY UPDATES
      // ============================================================================

      updateDependency: (type: 'plantData' | 'activityData' | 'weatherData' | 'userPreferences') => {
        const now = new Date();

        set((state) => {
          state.dependencies[type] = now;
        });

        // Invalidate related cache entries
        const dependencyMap = {
          plantData: ['plant', 'health'],
          activityData: ['activity', 'care', 'productivity'],
          weatherData: ['weather', 'seasonal'],
          userPreferences: ['user', 'personalized'],
        };

        get().invalidateCache(dependencyMap[type]);
      },

      // ============================================================================
      // CONFIGURATION
      // ============================================================================

      updateConfig: (newConfig: Partial<InsightsState['config']>) => {
        set((state) => {
          Object.assign(state.config, newConfig);
        });
      },

      // ============================================================================
      // UTILITY METHODS (PRIVATE)
      // ============================================================================

      getCachedInsight: <T = any>(key: string): InsightResponse<T> | null => {
        const entry = get().cache[key];
        if (!entry) return null;

        const now = new Date();
        if (entry.expiresAt < now) {
          // Remove expired entry
          set((state) => {
            delete state.cache[key];
          });
          return null;
        }

        return {
          success: true,
          data: entry.data as T,
          metadata: {
            type: key.split('_')[0],
            confidence: 1.0,
            sampleSize: 1,
            lastComputed: entry.generatedAt,
            computationCost: 'low' as const,
          },
          cached: true,
          computationTime: entry.computationTime,
        };
      },

      cacheInsight: <T = any>(key: string, response: InsightResponse<T>, request: InsightRequest) => {
        if (!response.success || !response.data) return;

        const { config } = get();
        const now = new Date();
        const ttl = config.defaultCacheTTL;

        // Determine dependencies based on insight type
        const dependencies = getDependencies(request);

        const entry: InsightCacheEntry<T> = {
          key,
          data: response.data,
          generatedAt: now,
          expiresAt: new Date(now.getTime() + ttl),
          dependencies,
          computationTime: response.computationTime || 0,
          version: '1.0',
        };

        set((state) => {
          state.cache[key] = entry;
        });

        // Trigger cache optimization if needed
        const cacheSize = Object.keys(get().cache).length;
        if (cacheSize > config.maxCacheSize * 1.1) {
          setTimeout(() => get().optimizeCache(), 0);
        }
      },

      // ============================================================================
      // UTILITY ACTIONS
      // ============================================================================

      clearError: () => set({ error: null }),

      reset: () => {
        get().stopBackgroundTasks();
        set(initialState);
      },
    })),
    {
      name: `${STORAGE_KEYS.ANALYSIS_CACHE}_insights`,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cache: state.cache,
        historical: state.historical,
        performance: state.performance,
        config: state.config,
        dependencies: state.dependencies,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for version 0 -> 1
          return {
            ...persistedState,
            performance: initialState.performance,
            config: initialState.config,
          };
        }
        return persistedState;
      },
    }
  )
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateCacheKey(request: InsightRequest): string {
  const parts = [request.type];

  if (request.plantId) parts.push(`plant_${request.plantId}`);
  if (request.timeRange) parts.push(`time_${request.timeRange}`);
  if (request.parameters) {
    const paramString = Object.entries(request.parameters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}_${value}`)
      .join('_');
    parts.push(`params_${paramString}`);
  }

  return parts.join('_');
}

function getDependencies(request: InsightRequest): string[] {
  const baseDependencies = ['activityData', 'plantData'];

  switch (request.type) {
    case 'activity_patterns':
      return [...baseDependencies];
    case 'health_trends':
      return [...baseDependencies, 'plantData'];
    case 'seasonal_patterns':
      return [...baseDependencies, 'weatherData'];
    case 'user_behavior':
      return [...baseDependencies, 'userPreferences'];
    case 'comparative_analysis':
      return [...baseDependencies];
    case 'personalized_tips':
      return [...baseDependencies, 'userPreferences', 'weatherData'];
    default:
      return baseDependencies;
  }
}

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useInsightCache = () => useInsightsStore((state) => state.cache);

export const useInsightPerformance = () => useInsightsStore((state) => state.performance);

export const useInsightLoading = () => useInsightsStore((state) => state.isLoading);

export const useInsightError = () => useInsightsStore((state) => state.error);

export const useInsightConfig = () => useInsightsStore((state) => state.config);

// ============================================================================
// ACTION HOOKS
// ============================================================================

export const useInsightActions = () => useInsightsStore((state) => ({
  getActivityPatterns: state.getActivityPatterns,
  getHealthTrends: state.getHealthTrends,
  getHealthPrediction: state.getHealthPrediction,
  getHealthReport: state.getHealthReport,
  getSeasonalPatterns: state.getSeasonalPatterns,
  getUserHabits: state.getUserHabits,
  getEngagementMetrics: state.getEngagementMetrics,
  getProductivityScore: state.getProductivityScore,
  getPersonalizedTips: state.getPersonalizedTips,
  getPlantComparison: state.getPlantComparison,
  getBenchmarks: state.getBenchmarks,
  getImprovementAreas: state.getImprovementAreas,
  getChartData: state.getChartData,
  clearCache: state.clearCache,
  precomputeInsights: state.precomputeInsights,
  warmupCache: state.warmupCache,
  updateDependency: state.updateDependency,
}));

// ============================================================================
// COMPUTED SELECTORS
// ============================================================================

export const useCacheStats = () => useInsightsStore((state) => {
  const cacheSize = Object.keys(state.cache).length;
  const now = new Date();
  const validEntries = Object.values(state.cache).filter(entry => entry.expiresAt > now).length;

  return {
    totalEntries: cacheSize,
    validEntries,
    expiredEntries: cacheSize - validEntries,
    hitRate: state.performance.cacheHitRate,
    averageComputationTime: state.performance.averageComputationTime,
  };
});

export const useHistoricalDataAvailable = () => useInsightsStore((state) => ({
  daily: Object.keys(state.historical.dailyMetrics).length,
  weekly: Object.keys(state.historical.weeklyTrends).length,
  monthly: Object.keys(state.historical.monthlyReports).length,
}));

// ============================================================================
// LIFECYCLE MANAGEMENT
// ============================================================================

// Initialize background tasks when store is first used
let backgroundTasksInitialized = false;

export const initializeInsightsStore = () => {
  if (backgroundTasksInitialized) return;

  const store = useInsightsStore.getState();

  if (store.config.enableBackgroundComputation) {
    store.startBackgroundTasks();
  }

  if (store.config.warmupOnLoad) {
    store.warmupCache().catch(error =>
      console.warn('Cache warmup failed:', error)
    );
  }

  backgroundTasksInitialized = true;
};

// Cleanup function for app termination
export const cleanupInsightsStore = () => {
  const store = useInsightsStore.getState();
  store.stopBackgroundTasks();
  backgroundTasksInitialized = false;
};

// Auto-cleanup historical data (call this periodically)
export const maintainInsightsStore = () => {
  const store = useInsightsStore.getState();
  store.cleanupHistoricalData(90); // Keep 90 days of historical data
  store.optimizeCache();
};

// Export actions for external use
export const insightsActions = {
  getActivityPatterns: (plantId?: string, forceRefresh = false) =>
    useInsightsStore.getState().getActivityPatterns(plantId, forceRefresh),
  getHealthTrends: (plantId: string, forceRefresh = false) =>
    useInsightsStore.getState().getHealthTrends(plantId, forceRefresh),
  getHealthReport: (plantId: string, forceRefresh = false) =>
    useInsightsStore.getState().getHealthReport(plantId, forceRefresh),
  getPersonalizedTips: (plantId?: string, forceRefresh = false) =>
    useInsightsStore.getState().getPersonalizedTips(plantId, forceRefresh),
  getChartData: <T = any>(chartType: 'line' | 'bar' | 'pie', dataType: string, plantId?: string, forceRefresh = false) =>
    useInsightsStore.getState().getChartData<T>(chartType, dataType, plantId, forceRefresh),
  clearCache: (pattern?: string) =>
    useInsightsStore.getState().clearCache(pattern),
  updateDependency: (type: 'plantData' | 'activityData' | 'weatherData' | 'userPreferences') =>
    useInsightsStore.getState().updateDependency(type),
  initialize: initializeInsightsStore,
  cleanup: cleanupInsightsStore,
  maintain: maintainInsightsStore,
};
