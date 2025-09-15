import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plant,
  ActivityEntry,
  STORAGE_KEYS
} from '../types';
import {
  WateringPattern,
  FertilizerUsage,
  PlantHealthTrend,
  ActivityHeatmapData,
  CareInsight,
  SuccessMetrics,
  DateRange,
  AnalyticsDataPoint,
  generateWateringPatterns,
  calculateFertilizerUsage,
  generatePlantHealthTrends,
  generateActivityHeatmap,
  generateCareInsights,
  calculateSuccessMetrics,
  getDateRangePresets,
  formatDataForCSV
} from '../utils/dataProcessing';

export type DateRangePreset = 'week' | 'month' | 'threeMonths' | 'year' | 'custom';

export interface AnalyticsMetrics {
  wateringPatterns: WateringPattern[];
  fertilizerUsage: FertilizerUsage[];
  healthTrends: PlantHealthTrend[];
  activityHeatmap: ActivityHeatmapData[];
  insights: CareInsight[];
  successMetrics: SuccessMetrics;
  totalActivities: number;
  activePlantsCount: number;
  averageCareFrequency: number;
}

export interface WeeklySummary {
  week: string; // ISO week string
  totalActivities: number;
  plantsWatered: number;
  plantsFertilized: number;
  averageHealthScore: number;
  topPerformingPlant?: string;
  insights: string[];
}

export interface MonthlySummary {
  month: string; // YYYY-MM format
  totalActivities: number;
  plantsWatered: number;
  plantsFertilized: number;
  averageHealthScore: number;
  topPerformingPlant?: string;
  achievements: string[];
  recommendations: string[];
}

interface AnalyticsState {
  // Current metrics based on selected date range
  currentMetrics: AnalyticsMetrics | null;

  // Date range selection
  selectedDateRange: DateRange;
  selectedPreset: DateRangePreset;

  // Historical summaries
  weeklySummaries: Record<string, WeeklySummary>;
  monthlySummaries: Record<string, MonthlySummary>;

  // Filter states
  selectedPlantIds: string[]; // Empty array means all plants
  selectedActivityTypes: string[]; // Empty array means all types

  // UI states
  isLoading: boolean;
  isCalculating: boolean;
  error: string | null;
  lastCalculated: Date | null;

  // Cached data for performance
  dataCache: Record<string, any>;
  cacheTimestamp: Date | null;
}

interface AnalyticsActions {
  // Metrics calculation
  calculateMetrics: (plants: Plant[], activities: Record<string, ActivityEntry[]>) => void;
  refreshMetrics: () => void;

  // Date range management
  setDateRange: (range: DateRange) => void;
  setDateRangePreset: (preset: DateRangePreset) => void;

  // Filtering
  setSelectedPlants: (plantIds: string[]) => void;
  setSelectedActivityTypes: (types: string[]) => void;
  clearFilters: () => void;

  // Summaries
  generateWeeklySummary: (plants: Plant[], activities: Record<string, ActivityEntry[]>, weekStart: Date) => WeeklySummary;
  generateMonthlySummary: (plants: Plant[], activities: Record<string, ActivityEntry[]>, month: string) => MonthlySummary;
  updateSummaries: (plants: Plant[], activities: Record<string, ActivityEntry[]>) => void;

  // Data export
  exportToCSV: (plants: Plant[], activities: Record<string, ActivityEntry[]>) => string;
  generatePDFData: () => any;

  // Insights and achievements
  dismissInsight: (insightId: string) => void;
  markInsightAsRead: (insightId: string) => void;
  getActionableInsights: () => CareInsight[];

  // Cache management
  clearCache: () => void;
  isCacheValid: () => boolean;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialState: AnalyticsState = {
  currentMetrics: null,
  selectedDateRange: getDateRangePresets().month,
  selectedPreset: 'month',
  weeklySummaries: {},
  monthlySummaries: {},
  selectedPlantIds: [],
  selectedActivityTypes: [],
  isLoading: false,
  isCalculating: false,
  error: null,
  lastCalculated: null,
  dataCache: {},
  cacheTimestamp: null,
};

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Metrics calculation
      calculateMetrics: (plants, activities) => {
        set((state) => {
          state.isCalculating = true;
          state.error = null;
        });

        try {
          const { selectedDateRange, selectedPlantIds, selectedActivityTypes } = get();

          // Filter plants if specific plants are selected
          const filteredPlants = selectedPlantIds.length > 0
            ? plants.filter(p => selectedPlantIds.includes(p.id))
            : plants;

          // Filter activities by date range and activity types
          const filteredActivities: Record<string, ActivityEntry[]> = {};

          filteredPlants.forEach(plant => {
            const plantActivities = activities[plant.id] || [];
            let filtered = plantActivities.filter(a => {
              const activityDate = new Date(a.dateISO);
              return activityDate >= selectedDateRange.start && activityDate <= selectedDateRange.end;
            });

            if (selectedActivityTypes.length > 0) {
              filtered = filtered.filter(a => selectedActivityTypes.includes(a.kind));
            }

            filteredActivities[plant.id] = filtered;
          });

          // Calculate all metrics
          const wateringPatterns = generateWateringPatterns(filteredPlants, filteredActivities);
          const fertilizerUsage = calculateFertilizerUsage(filteredPlants, filteredActivities);
          const healthTrends = generatePlantHealthTrends(filteredPlants, filteredActivities, selectedDateRange);
          const activityHeatmap = generateActivityHeatmap(
            Object.values(filteredActivities).flat(),
            selectedDateRange
          );
          const insights = generateCareInsights(filteredPlants, filteredActivities, wateringPatterns, healthTrends);
          const successMetrics = calculateSuccessMetrics(filteredPlants, filteredActivities, healthTrends);

          // Calculate additional metrics
          const totalActivities = Object.values(filteredActivities).flat().length;
          const activePlantsCount = filteredPlants.filter(plant =>
            (filteredActivities[plant.id] || []).length > 0
          ).length;

          const averageCareFrequency = wateringPatterns.length > 0
            ? wateringPatterns.reduce((sum, p) => sum + p.frequency, 0) / wateringPatterns.length
            : 0;

          const metrics: AnalyticsMetrics = {
            wateringPatterns,
            fertilizerUsage,
            healthTrends,
            activityHeatmap,
            insights,
            successMetrics,
            totalActivities,
            activePlantsCount,
            averageCareFrequency
          };

          set((state) => {
            state.currentMetrics = metrics;
            state.isCalculating = false;
            state.lastCalculated = new Date();
            state.cacheTimestamp = new Date();

            // Cache the results
            const cacheKey = `${selectedDateRange.start.toISOString()}-${selectedDateRange.end.toISOString()}-${selectedPlantIds.join(',')}-${selectedActivityTypes.join(',')}`;
            state.dataCache[cacheKey] = metrics;
          });

        } catch (error) {
          console.error('Error calculating analytics metrics:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Failed to calculate metrics';
            state.isCalculating = false;
          });
        }
      },

      refreshMetrics: () => {
        // This would typically be called with current plants and activities data
        // For now, we'll clear the cache and trigger a recalculation
        set((state) => {
          state.dataCache = {};
          state.cacheTimestamp = null;
          state.currentMetrics = null;
        });
      },

      // Date range management
      setDateRange: (range) => {
        set((state) => {
          state.selectedDateRange = range;
          state.selectedPreset = 'custom';
          // Clear cache when date range changes
          state.dataCache = {};
          state.cacheTimestamp = null;
        });
      },

      setDateRangePreset: (preset) => {
        const presets = getDateRangePresets();
        const range = presets[preset as keyof typeof presets];

        if (range) {
          set((state) => {
            state.selectedDateRange = range;
            state.selectedPreset = preset;
            // Clear cache when date range changes
            state.dataCache = {};
            state.cacheTimestamp = null;
          });
        }
      },

      // Filtering
      setSelectedPlants: (plantIds) => {
        set((state) => {
          state.selectedPlantIds = plantIds;
          // Clear cache when filters change
          state.dataCache = {};
          state.cacheTimestamp = null;
        });
      },

      setSelectedActivityTypes: (types) => {
        set((state) => {
          state.selectedActivityTypes = types;
          // Clear cache when filters change
          state.dataCache = {};
          state.cacheTimestamp = null;
        });
      },

      clearFilters: () => {
        set((state) => {
          state.selectedPlantIds = [];
          state.selectedActivityTypes = [];
          // Clear cache when filters change
          state.dataCache = {};
          state.cacheTimestamp = null;
        });
      },

      // Summaries
      generateWeeklySummary: (plants, activities, weekStart) => {
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekRange = { start: weekStart, end: weekEnd };
        const weekString = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD

        // Filter activities for this week
        const weekActivities: Record<string, ActivityEntry[]> = {};
        plants.forEach(plant => {
          const plantActivities = activities[plant.id] || [];
          weekActivities[plant.id] = plantActivities.filter(a => {
            const activityDate = new Date(a.dateISO);
            return activityDate >= weekStart && activityDate < weekEnd;
          });
        });

        const totalActivities = Object.values(weekActivities).flat().length;
        const plantsWatered = plants.filter(plant =>
          weekActivities[plant.id]?.some(a => a.kind === 'water')
        ).length;
        const plantsFertilized = plants.filter(plant =>
          weekActivities[plant.id]?.some(a => a.kind === 'fertilizer')
        ).length;

        // Calculate average health score for the week
        const healthTrends = generatePlantHealthTrends(plants, weekActivities, weekRange);
        const averageHealthScore = healthTrends.length > 0
          ? healthTrends.reduce((sum, trend) => sum + trend.score, 0) / healthTrends.length
          : 0;

        // Find top performing plant
        const topPerformingPlant = healthTrends.length > 0
          ? healthTrends.reduce((top, current) =>
              current.score > top.score ? current : top
            ).plantName
          : undefined;

        // Generate insights for the week
        const insights = generateCareInsights(plants, weekActivities, [], healthTrends)
          .filter(insight => insight.type === 'success' || insight.type === 'achievement')
          .map(insight => insight.title);

        return {
          week: weekString,
          totalActivities,
          plantsWatered,
          plantsFertilized,
          averageHealthScore: Math.round(averageHealthScore),
          topPerformingPlant,
          insights
        };
      },

      generateMonthlySummary: (plants, activities, month) => {
        const [year, monthNum] = month.split('-').map(Number);
        const monthStart = new Date(year, monthNum - 1, 1);
        const monthEnd = new Date(year, monthNum, 0); // Last day of month
        const monthRange = { start: monthStart, end: monthEnd };

        // Filter activities for this month
        const monthActivities: Record<string, ActivityEntry[]> = {};
        plants.forEach(plant => {
          const plantActivities = activities[plant.id] || [];
          monthActivities[plant.id] = plantActivities.filter(a => {
            const activityDate = new Date(a.dateISO);
            return activityDate >= monthStart && activityDate <= monthEnd;
          });
        });

        const totalActivities = Object.values(monthActivities).flat().length;
        const plantsWatered = plants.filter(plant =>
          monthActivities[plant.id]?.some(a => a.kind === 'water')
        ).length;
        const plantsFertilized = plants.filter(plant =>
          monthActivities[plant.id]?.some(a => a.kind === 'fertilizer')
        ).length;

        // Calculate average health score for the month
        const healthTrends = generatePlantHealthTrends(plants, monthActivities, monthRange);
        const averageHealthScore = healthTrends.length > 0
          ? healthTrends.reduce((sum, trend) => sum + trend.score, 0) / healthTrends.length
          : 0;

        // Find top performing plant
        const topPerformingPlant = healthTrends.length > 0
          ? healthTrends.reduce((top, current) =>
              current.score > top.score ? current : top
            ).plantName
          : undefined;

        // Generate achievements and recommendations
        const allInsights = generateCareInsights(plants, monthActivities, [], healthTrends);
        const achievements = allInsights
          .filter(insight => insight.type === 'achievement')
          .map(insight => insight.title);

        const recommendations = allInsights
          .filter(insight => insight.type === 'warning' && insight.actionable)
          .map(insight => insight.description);

        return {
          month,
          totalActivities,
          plantsWatered,
          plantsFertilized,
          averageHealthScore: Math.round(averageHealthScore),
          topPerformingPlant,
          achievements,
          recommendations
        };
      },

      updateSummaries: (plants, activities) => {
        // Generate summaries for the last 12 weeks and 12 months
        const now = new Date();

        // Weekly summaries
        for (let i = 0; i < 12; i++) {
          const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          const summary = get().generateWeeklySummary(plants, activities, weekStart);

          set((state) => {
            state.weeklySummaries[summary.week] = summary;
          });
        }

        // Monthly summaries
        for (let i = 0; i < 12; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthString = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
          const summary = get().generateMonthlySummary(plants, activities, monthString);

          set((state) => {
            state.monthlySummaries[monthString] = summary;
          });
        }
      },

      // Data export
      exportToCSV: (plants, activities) => {
        return formatDataForCSV(plants, activities);
      },

      generatePDFData: () => {
        const { currentMetrics, selectedDateRange } = get();
        if (!currentMetrics) return null;

        return {
          title: 'Plant Care Analytics Report',
          dateRange: `${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`,
          metrics: currentMetrics,
          generatedAt: new Date().toISOString()
        };
      },

      // Insights and achievements
      dismissInsight: (insightId) => {
        set((state) => {
          if (state.currentMetrics) {
            state.currentMetrics.insights = state.currentMetrics.insights.filter(
              insight => insight.id !== insightId
            );
          }
        });
      },

      markInsightAsRead: (insightId) => {
        // This could be used to track which insights have been read
        // For now, we'll just log it
        console.log(`Insight marked as read: ${insightId}`);
      },

      getActionableInsights: () => {
        const { currentMetrics } = get();
        return currentMetrics?.insights.filter(insight => insight.actionable) || [];
      },

      // Cache management
      clearCache: () => {
        set((state) => {
          state.dataCache = {};
          state.cacheTimestamp = null;
        });
      },

      isCacheValid: () => {
        const { cacheTimestamp } = get();
        if (!cacheTimestamp) return false;

        const now = new Date().getTime();
        const cacheTime = cacheTimestamp.getTime();
        return (now - cacheTime) < CACHE_DURATION;
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    })),
    {
      name: STORAGE_KEYS.ANALYSIS_CACHE,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedDateRange: state.selectedDateRange,
        selectedPreset: state.selectedPreset,
        selectedPlantIds: state.selectedPlantIds,
        selectedActivityTypes: state.selectedActivityTypes,
        weeklySummaries: state.weeklySummaries,
        monthlySummaries: state.monthlySummaries,
      }),
      version: 1,
    }
  )
);

// Selectors for optimized component rendering
export const useAnalyticsMetrics = () => {
  return useAnalyticsStore((state) => state.currentMetrics);
};

export const useAnalyticsFilters = () => {
  return useAnalyticsStore((state) => ({
    selectedPlantIds: state.selectedPlantIds,
    selectedActivityTypes: state.selectedActivityTypes,
    selectedDateRange: state.selectedDateRange,
    selectedPreset: state.selectedPreset
  }));
};

export const useAnalyticsLoading = () => {
  return useAnalyticsStore((state) => ({
    isLoading: state.isLoading,
    isCalculating: state.isCalculating,
    error: state.error
  }));
};

export const useAnalyticsSummaries = () => {
  return useAnalyticsStore((state) => ({
    weeklySummaries: state.weeklySummaries,
    monthlySummaries: state.monthlySummaries
  }));
};

// Actions for external use
export const analyticsActions = {
  calculateMetrics: (plants: Plant[], activities: Record<string, ActivityEntry[]>) =>
    useAnalyticsStore.getState().calculateMetrics(plants, activities),
  setDateRangePreset: (preset: DateRangePreset) =>
    useAnalyticsStore.getState().setDateRangePreset(preset),
  exportToCSV: (plants: Plant[], activities: Record<string, ActivityEntry[]>) =>
    useAnalyticsStore.getState().exportToCSV(plants, activities),
  clearFilters: () => useAnalyticsStore.getState().clearFilters(),
  refreshMetrics: () => useAnalyticsStore.getState().refreshMetrics(),
};