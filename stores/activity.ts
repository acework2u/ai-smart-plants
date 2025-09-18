import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityEntry,
  CreateActivityInput,
  UpdateActivityInput,
  ActivityKind,
  ActivityFilter,
  ActivityStats,
  PlantPrefs,
  STORAGE_KEYS
} from '../types';
import { generateId } from '../utils/ids';

interface ActivityState {
  activities: Record<string, ActivityEntry[]>; // plantId -> activities
  isLoading: boolean;
  error: string | null;
  currentPlantId: string | null;
  filter: ActivityFilter | null;
  stats: Record<string, ActivityStats>; // plantId -> stats
  lastUpdated: Date | null;
}

interface ActivityActions {
  // Activity CRUD operations
  addActivity: (activity: CreateActivityInput) => void;
  updateActivity: (plantId: string, activityId: string, updates: UpdateActivityInput) => void;
  deleteActivity: (plantId: string, activityId: string) => void;
  getActivity: (plantId: string, activityId: string) => ActivityEntry | undefined;

  // Activity retrieval
  getActivities: (plantId: string) => ActivityEntry[];
  getRecentActivity: (plantId: string, kind?: ActivityKind) => ActivityEntry | null;
  getActivityHistory: (plantId: string, days?: number) => ActivityEntry[];

  // Integration with preferences store
  updateLastActivityPrefs: (plantId: string, activity: CreateActivityInput) => void;

  // Filtering and search
  setCurrentPlant: (plantId: string | null) => void;
  setFilter: (filter: ActivityFilter | null) => void;
  getFilteredActivities: (plantId: string, filter?: ActivityFilter) => ActivityEntry[];

  // Statistics and analytics
  calculateStats: (plantId: string) => void;
  calculateAllStats: () => void;
  getActivityFrequency: (plantId: string, kind: ActivityKind) => number; // days between activities

  // Batch operations
  importActivities: (plantId: string, activities: CreateActivityInput[]) => void;
  exportActivities: (plantId: string) => ActivityEntry[];
  clearPlantActivities: (plantId: string) => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState: ActivityState = {
  activities: {},
  isLoading: false,
  error: null,
  currentPlantId: null,
  filter: null,
  stats: {},
  lastUpdated: null,
};

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Activity CRUD operations
      addActivity: (activityInput) => {
        const newActivity: ActivityEntry = {
          ...activityInput,
          id: generateId(),
          createdAt: new Date(),
        };

        const { plantId } = newActivity;

        set((state) => {
          if (!state.activities[plantId]) {
            state.activities[plantId] = [];
          }

          // Add to beginning of array (most recent first)
          state.activities[plantId].unshift(newActivity);

          // Keep only last 100 activities per plant for performance
          if (state.activities[plantId].length > 100) {
            state.activities[plantId] = state.activities[plantId].slice(0, 100);
          }

          state.lastUpdated = new Date();
          state.error = null;
        });

        // Update plant preferences with last activity
        get().updateLastActivityPrefs(plantId, activityInput);

        // Recalculate stats
        get().calculateStats(plantId);

        // Analytics tracking
        console.log('Activity added:', newActivity.kind, 'for plant', plantId);
      },

      updateActivity: (plantId, activityId, updates) => {
        set((state) => {
          const activities = state.activities[plantId];
          if (activities) {
            const activityIndex = activities.findIndex((a: ActivityEntry) => a.id === activityId);
            if (activityIndex !== -1) {
              activities[activityIndex] = {
                ...activities[activityIndex],
                ...updates,
              };
              state.lastUpdated = new Date();
            }
          }
        });

        get().calculateStats(plantId);
      },

      deleteActivity: (plantId, activityId) => {
        set((state) => {
          if (state.activities[plantId]) {
            state.activities[plantId] = state.activities[plantId].filter(
              (a: ActivityEntry) => a.id !== activityId
            );
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats(plantId);
      },

      getActivity: (plantId, activityId) => {
        const activities = get().activities[plantId] || [];
        return activities.find(a => a.id === activityId);
      },

      // Activity retrieval
      getActivities: (plantId) => {
        return get().activities[plantId] || [];
      },

      getRecentActivity: (plantId, kind) => {
        const activities = get().activities[plantId] || [];
        return activities.find(a => !kind || a.kind === kind) || null;
      },

      getActivityHistory: (plantId, days = 30) => {
        const activities = get().activities[plantId] || [];
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return activities.filter(a => new Date(a.dateISO) >= cutoffDate);
      },

      // Integration with preferences store
      updateLastActivityPrefs: (plantId, activity) => {
        // Import preferences store dynamically to avoid circular dependency
        try {
          const { usePrefsStore } = require('./prefsStore');

          const prefs: Partial<PlantPrefs> = {
            lastKind: activity.kind,
            lastUnit: activity.unit,
            lastQty: activity.quantity,
          };

          if (activity.npk) {
            prefs.lastNPK = activity.npk;
          }

          usePrefsStore.getState().updatePlantPrefs(plantId, prefs);
        } catch (error) {
          console.warn('Failed to update plant preferences:', error);
        }
      },

      // Filtering and search
      setCurrentPlant: (plantId) => set({ currentPlantId: plantId }),

      setFilter: (filter) => set({ filter }),

      getFilteredActivities: (plantId, filter) => {
        const activities = get().activities[plantId] || [];

        if (!filter) return activities;

        let filtered = activities;

        // Filter by activity kinds
        if (filter.kinds && filter.kinds.length > 0) {
          filtered = filtered.filter(a => filter.kinds!.includes(a.kind));
        }

        // Filter by date range
        if (filter.dateRange) {
          const { start, end } = filter.dateRange;
          filtered = filtered.filter(a => {
            const activityDate = new Date(a.dateISO);
            return activityDate >= start && activityDate <= end;
          });
        }

        // Filter by quantity presence
        if (filter.hasQuantity !== undefined) {
          filtered = filtered.filter(a =>
            filter.hasQuantity ? !!a.quantity : !a.quantity
          );
        }

        // Filter by source
        if (filter.source) {
          filtered = filtered.filter(a => a.source === filter.source);
        }

        return filtered;
      },

      // Statistics and analytics
      calculateStats: (plantId) => {
        const activities = get().activities[plantId] || [];

        if (activities.length === 0) {
          set((state) => {
            delete state.stats[plantId];
          });
          return;
        }

        // Calculate stats by activity kind
        const byKind = activities.reduce((acc, activity) => {
          acc[activity.kind] = (acc[activity.kind] || 0) + 1;
          return acc;
        }, {} as Record<ActivityKind, number>);

        // Calculate stats by month
        const byMonth = activities.reduce((acc, activity) => {
          const monthKey = new Date(activity.dateISO).toISOString().slice(0, 7); // YYYY-MM
          acc[monthKey] = (acc[monthKey] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate average frequency for each activity kind
        const averageFrequency: Record<ActivityKind, number> = {} as any;
        Object.keys(byKind).forEach(kind => {
          const kindActivities = activities.filter(a => a.kind === kind as ActivityKind);
          if (kindActivities.length > 1) {
            const dates = kindActivities.map(a => new Date(a.dateISO)).sort();
            const totalDays = (dates[0].getTime() - dates[dates.length - 1].getTime()) / (1000 * 60 * 60 * 24);
            averageFrequency[kind as ActivityKind] = Math.abs(totalDays) / (kindActivities.length - 1);
          } else {
            averageFrequency[kind as ActivityKind] = 0;
          }
        });

        const stats: ActivityStats = {
          totalActivities: activities.length,
          byKind,
          byMonth,
          averageFrequency,
          lastActivity: activities[0], // Most recent (array is sorted)
        };

        set((state) => {
          state.stats[plantId] = stats;
        });
      },

      calculateAllStats: () => {
        const plantIds = Object.keys(get().activities);
        plantIds.forEach(plantId => get().calculateStats(plantId));
      },

      getActivityFrequency: (plantId, kind) => {
        const stats = get().stats[plantId];
        return stats?.averageFrequency[kind] || 0;
      },

      // Batch operations
      importActivities: (plantId, activities) => {
        const newActivities = activities.map(activityInput => ({
          ...activityInput,
          id: generateId(),
          createdAt: new Date(),
        }));

        set((state) => {
          if (!state.activities[plantId]) {
            state.activities[plantId] = [];
          }

          // Add all activities and sort by date
          state.activities[plantId] = [
            ...state.activities[plantId],
            ...newActivities
          ].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

          // Limit to 100 activities
          if (state.activities[plantId].length > 100) {
            state.activities[plantId] = state.activities[plantId].slice(0, 100);
          }

          state.lastUpdated = new Date();
        });

        get().calculateStats(plantId);
      },

      exportActivities: (plantId) => {
        return get().activities[plantId] || [];
      },

      clearPlantActivities: (plantId) => {
        set((state) => {
          delete state.activities[plantId];
          delete state.stats[plantId];
          state.lastUpdated = new Date();
        });
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    })),
    {
      name: STORAGE_KEYS.ACTIVITIES,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activities: state.activities,
        stats: state.stats,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
    }
  )
);

// Stable empty array to prevent re-renders
const EMPTY_ACTIVITIES: ActivityEntry[] = [];

// Optimized selectors
export const usePlantActivities = (plantId: string | null) => {
  return useActivityStore((state) => {
    if (!plantId) return EMPTY_ACTIVITIES;
    return state.activities[plantId] ?? EMPTY_ACTIVITIES;
  });
};

// Note: Plant preferences moved to preferences store
// Use usePlantPreferences from preferences store instead

export const useActivityStats = (plantId: string | null) => {
  return useActivityStore((state) =>
    plantId ? state.stats[plantId] || null : null
  );
};

export const useRecentActivity = (plantId: string | null, kind?: ActivityKind) => {
  return useActivityStore((state) => {
    if (!plantId) return null;
    const activities = state.activities[plantId] || [];
    return activities.find(a => !kind || a.kind === kind) || null;
  });
};

// Actions for external use
export const activityActions = {
  addActivity: (activity: CreateActivityInput) => useActivityStore.getState().addActivity(activity),
  calculateStats: (plantId: string) => useActivityStore.getState().calculateStats(plantId),
  reset: () => useActivityStore.getState().reset(),
};
