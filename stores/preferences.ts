import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlantPrefs,
  ActivityKind,
  Unit,
  NPK,
  UserPreferences,
  STORAGE_KEYS
} from '../types';

interface PreferencesState {
  // Per-plant preferences
  plantPrefs: Record<string, PlantPrefs>; // plantId -> preferences

  // Global user preferences
  userPrefs: UserPreferences;

  // App state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface PreferencesActions {
  // Plant preferences management
  getPlantPrefs: (plantId: string) => PlantPrefs;
  setPlantPrefs: (plantId: string, prefs: Partial<PlantPrefs>) => void;
  updatePlantPrefs: (plantId: string, updates: Partial<PlantPrefs>) => void;
  deletePlantPrefs: (plantId: string) => void;
  clearAllPlantPrefs: () => void;

  // Quick activity preference updates
  updateLastActivity: (plantId: string, kind: ActivityKind, quantity?: string, unit?: Unit, npk?: NPK) => void;
  updatePreferredUnits: (plantId: string, wateringUnit?: Unit, fertilizerUnit?: Unit) => void;
  updateReminderSettings: (plantId: string, settings: PlantPrefs['reminderSettings']) => void;

  // Global user preferences
  getUserPrefs: () => UserPreferences;
  setUserPrefs: (prefs: Partial<UserPreferences>) => void;
  updateLanguage: (language: 'th' | 'en') => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateUnits: (units: Partial<UserPreferences['units']>) => void;
  updatePrivacySettings: (privacy: Partial<UserPreferences['privacy']>) => void;

  // Bulk operations
  importPlantPrefs: (plantPrefs: Record<string, PlantPrefs>) => void;
  exportPlantPrefs: () => Record<string, PlantPrefs>;

  // Analytics and insights
  getMostUsedUnit: (kind?: ActivityKind) => Unit | null;
  getMostUsedNPK: () => NPK | null;
  getActivityFrequencyPrefs: (plantId: string) => Record<ActivityKind, number>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
  resetUserPrefs: () => void;
  resetPlantPrefs: () => void;
}

const defaultUserPrefs: UserPreferences = {
  language: 'th',
  theme: 'light',
  notifications: true,
  haptics: true,
  units: {
    volume: 'ml',
    weight: 'g',
    temperature: 'celsius',
  },
  privacy: {
    analytics: true,
    crashReporting: true,
    personalizedTips: true,
  },
};

const initialState: PreferencesState = {
  plantPrefs: {},
  userPrefs: defaultUserPrefs,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Plant preferences management
      getPlantPrefs: (plantId) => {
        return get().plantPrefs[plantId] || {};
      },

      setPlantPrefs: (plantId, prefs) => {
        set((state) => {
          state.plantPrefs[plantId] = {
            ...state.plantPrefs[plantId],
            ...prefs,
          };
          state.lastUpdated = new Date();
          state.error = null;
        });

        console.log('Plant preferences updated:', plantId, prefs);
      },

      updatePlantPrefs: (plantId, updates) => {
        set((state) => {
          if (!state.plantPrefs[plantId]) {
            state.plantPrefs[plantId] = {};
          }

          state.plantPrefs[plantId] = {
            ...state.plantPrefs[plantId],
            ...updates,
          };
          state.lastUpdated = new Date();
        });
      },

      deletePlantPrefs: (plantId) => {
        set((state) => {
          delete state.plantPrefs[plantId];
          state.lastUpdated = new Date();
        });

        console.log('Plant preferences deleted:', plantId);
      },

      clearAllPlantPrefs: () => {
        set((state) => {
          state.plantPrefs = {};
          state.lastUpdated = new Date();
        });

        console.log('All plant preferences cleared');
      },

      // Quick activity preference updates
      updateLastActivity: (plantId, kind, quantity, unit, npk) => {
        const updates: Partial<PlantPrefs> = {
          lastKind: kind,
        };

        if (quantity) updates.lastQty = quantity;
        if (unit) updates.lastUnit = unit;
        if (npk) updates.lastNPK = npk;

        get().updatePlantPrefs(plantId, updates);
      },

      updatePreferredUnits: (plantId, wateringUnit, fertilizerUnit) => {
        const updates: Partial<PlantPrefs> = {};

        if (wateringUnit) updates.preferredWateringUnit = wateringUnit as 'ml' | 'ล.';
        if (fertilizerUnit) updates.preferredFertilizerUnit = fertilizerUnit as 'g' | 'ml';

        get().updatePlantPrefs(plantId, updates);
      },

      updateReminderSettings: (plantId, settings) => {
        get().updatePlantPrefs(plantId, { reminderSettings: settings });
      },

      // Global user preferences
      getUserPrefs: () => get().userPrefs,

      setUserPrefs: (prefs) => {
        set((state) => {
          state.userPrefs = {
            ...state.userPrefs,
            ...prefs,
          };
          state.lastUpdated = new Date();
        });

        console.log('User preferences updated:', prefs);
      },

      updateLanguage: (language) => {
        get().setUserPrefs({ language });
      },

      updateTheme: (theme) => {
        get().setUserPrefs({ theme });
      },

      updateUnits: (units) => {
        set((state) => {
          state.userPrefs.units = {
            ...state.userPrefs.units,
            ...units,
          };
          state.lastUpdated = new Date();
        });
      },

      updatePrivacySettings: (privacy) => {
        set((state) => {
          state.userPrefs.privacy = {
            ...state.userPrefs.privacy,
            ...privacy,
          };
          state.lastUpdated = new Date();
        });
      },

      // Bulk operations
      importPlantPrefs: (plantPrefs) => {
        set((state) => {
          state.plantPrefs = { ...state.plantPrefs, ...plantPrefs };
          state.lastUpdated = new Date();
        });

        console.log('Plant preferences imported:', Object.keys(plantPrefs).length, 'plants');
      },

      exportPlantPrefs: () => {
        return get().plantPrefs;
      },

      // Analytics and insights
      getMostUsedUnit: (kind) => {
        const plantPrefs = get().plantPrefs;
        const unitCounts: Record<string, number> = {};

        Object.values(plantPrefs).forEach(prefs => {
          let unit: Unit | undefined;

          if (kind) {
            // Check for specific activity kind preferences
            if (kind === 'รดน้ำ' && prefs.preferredWateringUnit) {
              unit = prefs.preferredWateringUnit;
            } else if (kind === 'ใส่ปุ๋ย' && prefs.preferredFertilizerUnit) {
              unit = prefs.preferredFertilizerUnit;
            } else if (prefs.lastKind === kind && prefs.lastUnit) {
              unit = prefs.lastUnit;
            }
          } else if (prefs.lastUnit) {
            unit = prefs.lastUnit;
          }

          if (unit) {
            unitCounts[unit] = (unitCounts[unit] || 0) + 1;
          }
        });

        const mostUsed = Object.entries(unitCounts).sort(([,a], [,b]) => b - a)[0];
        return mostUsed ? (mostUsed[0] as Unit) : null;
      },

      getMostUsedNPK: () => {
        const plantPrefs = get().plantPrefs;
        const npkCounts: Record<string, { npk: NPK; count: number }> = {};

        Object.values(plantPrefs).forEach(prefs => {
          if (prefs.lastNPK) {
            const npkKey = `${prefs.lastNPK.n}-${prefs.lastNPK.p}-${prefs.lastNPK.k}`;
            if (!npkCounts[npkKey]) {
              npkCounts[npkKey] = { npk: prefs.lastNPK, count: 0 };
            }
            npkCounts[npkKey].count++;
          }
        });

        const mostUsed = Object.values(npkCounts).sort((a, b) => b.count - a.count)[0];
        return mostUsed ? mostUsed.npk : null;
      },

      getActivityFrequencyPrefs: (plantId) => {
        const prefs = get().plantPrefs[plantId];
        const frequencies: Record<ActivityKind, number> = {
          'รดน้ำ': 7, // Default frequencies in days
          'ใส่ปุ๋ย': 30,
          'พ่นยา': 14,
          'ย้ายกระถาง': 365,
          'ตรวจใบ': 7,
        };

        if (prefs?.reminderSettings) {
          const { reminderSettings } = prefs;
          if (reminderSettings.wateringInterval) {
            frequencies['รดน้ำ'] = reminderSettings.wateringInterval;
          }
          if (reminderSettings.fertilizingInterval) {
            frequencies['ใส่ปุ๋ย'] = reminderSettings.fertilizingInterval;
          }
        }

        return frequencies;
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => set(initialState),

      resetUserPrefs: () => {
        set((state) => {
          state.userPrefs = defaultUserPrefs;
          state.lastUpdated = new Date();
        });
      },

      resetPlantPrefs: () => {
        set((state) => {
          state.plantPrefs = {};
          state.lastUpdated = new Date();
        });
      },
    })),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plantPrefs: state.plantPrefs,
        userPrefs: state.userPrefs,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for version 0 -> 1
          return {
            ...persistedState,
            userPrefs: { ...defaultUserPrefs, ...persistedState.userPrefs },
          };
        }
        return persistedState;
      },
    }
  )
);

// Optimized selectors
export const usePlantPreferences = (plantId: string | null) => {
  return usePreferencesStore((state) =>
    plantId ? state.plantPrefs[plantId] || {} : {}
  );
};

export const useUserPreferences = () => {
  return usePreferencesStore((state) => state.userPrefs);
};

export const useLanguagePreference = () => {
  return usePreferencesStore((state) => state.userPrefs.language);
};

export const useThemePreference = () => {
  return usePreferencesStore((state) => state.userPrefs.theme);
};

export const useUnitPreferences = () => {
  return usePreferencesStore((state) => state.userPrefs.units);
};

export const useLastActivityPrefs = (plantId: string | null) => {
  return usePreferencesStore((state) => {
    if (!plantId) return {};
    const prefs = state.plantPrefs[plantId] || {};
    return {
      lastKind: prefs.lastKind,
      lastUnit: prefs.lastUnit,
      lastQty: prefs.lastQty,
      lastNPK: prefs.lastNPK,
    };
  });
};

export const useReminderPreferences = (plantId: string | null) => {
  return usePreferencesStore((state) => {
    if (!plantId) return undefined;
    return state.plantPrefs[plantId]?.reminderSettings;
  });
};

// Actions for external use
export const preferencesActions = {
  getPlantPrefs: (plantId: string) => usePreferencesStore.getState().getPlantPrefs(plantId),
  setPlantPrefs: (plantId: string, prefs: Partial<PlantPrefs>) => usePreferencesStore.getState().setPlantPrefs(plantId, prefs),
  updateLastActivity: (plantId: string, kind: ActivityKind, quantity?: string, unit?: Unit, npk?: NPK) =>
    usePreferencesStore.getState().updateLastActivity(plantId, kind, quantity, unit, npk),
  updateLanguage: (language: 'th' | 'en') => usePreferencesStore.getState().updateLanguage(language),
  updateTheme: (theme: 'light' | 'dark' | 'system') => usePreferencesStore.getState().updateTheme(theme),
  reset: () => usePreferencesStore.getState().reset(),
};