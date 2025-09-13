import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, CreatePlantInput, UpdatePlantInput, GardenFilter, GardenStats, STORAGE_KEYS } from '../types';

interface GardenState {
  plants: Plant[];
  selectedPlant: Plant | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filter: GardenFilter;
  stats: GardenStats | null;
  lastUpdated: Date | null;
}

interface GardenActions {
  // Plant CRUD operations
  addPlant: (plant: CreatePlantInput) => void;
  updatePlant: (id: string, updates: UpdatePlantInput) => void;
  deletePlant: (id: string) => void;
  getPlant: (id: string) => Plant | undefined;

  // Selection and filtering
  selectPlant: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: GardenFilter) => void;

  // Async operations
  loadPlants: () => Promise<void>;
  refreshPlant: (id: string) => Promise<void>;
  syncPlants: () => Promise<void>;

  // Batch operations
  bulkUpdatePlants: (updates: Array<{ id: string; updates: UpdatePlantInput }>) => void;
  bulkDeletePlants: (ids: string[]) => void;

  // Statistics and analytics
  calculateStats: () => void;
  getHealthySummary: () => { healthy: number; warning: number; critical: number };

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState: GardenState = {
  plants: [],
  selectedPlant: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filter: 'all',
  stats: null,
  lastUpdated: null,
};

export const useGardenStore = create<GardenState & GardenActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Plant CRUD operations
      addPlant: (plantInput) => {
        const newPlant: Plant = {
          ...plantInput,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          state.plants.push(newPlant);
          state.lastUpdated = new Date();
          state.error = null;
        });

        // Recalculate stats after adding
        get().calculateStats();

        // Analytics tracking
        console.log('Plant added:', newPlant.name);
      },

      updatePlant: (id, updates) => {
        set((state) => {
          const plantIndex = state.plants.findIndex((p: Plant) => p.id === id);
          if (plantIndex !== -1) {
            state.plants[plantIndex] = {
              ...state.plants[plantIndex],
              ...updates,
              updatedAt: new Date(),
            };

            // Update selected plant if it's the one being updated
            if (state.selectedPlant?.id === id) {
              state.selectedPlant = state.plants[plantIndex];
            }

            state.lastUpdated = new Date();
            state.error = null;
          }
        });

        get().calculateStats();
      },

      deletePlant: (id) => {
        set((state) => {
          state.plants = state.plants.filter((p: Plant) => p.id !== id);
          if (state.selectedPlant?.id === id) {
            state.selectedPlant = null;
          }
          state.lastUpdated = new Date();
          state.error = null;
        });

        get().calculateStats();

        // Analytics tracking
        console.log('Plant deleted:', id);
      },

      getPlant: (id) => {
        return get().plants.find(p => p.id === id);
      },

      // Selection and filtering
      selectPlant: (id) => {
        const plant = id ? get().plants.find(p => p.id === id) || null : null;
        set({ selectedPlant: plant });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setFilter: (filter) => {
        set({ filter });
      },

      // Async operations
      loadPlants: async () => {
        set({ isLoading: true, error: null });

        try {
          // Simulate API call or data loading
          await new Promise(resolve => setTimeout(resolve, 500));

          set((state) => {
            state.isLoading = false;
            state.lastUpdated = new Date();
          });

          get().calculateStats();
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load plants',
          });
        }
      },

      refreshPlant: async (id) => {
        const plant = get().plants.find(p => p.id === id);
        if (!plant) return;

        try {
          // Simulate refresh from API
          await new Promise(resolve => setTimeout(resolve, 300));

          set((state) => {
            const plantIndex = state.plants.findIndex((p: Plant) => p.id === id);
            if (plantIndex !== -1) {
              state.plants[plantIndex].updatedAt = new Date();
            }
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to refresh plant',
          });
        }
      },

      syncPlants: async () => {
        set({ isLoading: true, error: null });

        try {
          // Simulate sync with remote service
          await new Promise(resolve => setTimeout(resolve, 1000));

          set((state) => {
            state.isLoading = false;
            state.lastUpdated = new Date();
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Sync failed',
          });
        }
      },

      // Batch operations
      bulkUpdatePlants: (updates) => {
        set((state) => {
          updates.forEach(({ id, updates: plantUpdates }) => {
            const plantIndex = state.plants.findIndex((p: Plant) => p.id === id);
            if (plantIndex !== -1) {
              state.plants[plantIndex] = {
                ...state.plants[plantIndex],
                ...plantUpdates,
                updatedAt: new Date(),
              };
            }
          });
          state.lastUpdated = new Date();
        });

        get().calculateStats();
      },

      bulkDeletePlants: (ids) => {
        set((state) => {
          state.plants = state.plants.filter((p: Plant) => !ids.includes(p.id));
          if (state.selectedPlant && ids.includes(state.selectedPlant.id)) {
            state.selectedPlant = null;
          }
          state.lastUpdated = new Date();
        });

        get().calculateStats();
      },

      // Statistics and analytics
      calculateStats: () => {
        const plants = get().plants;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats: GardenStats = {
          totalPlants: plants.length,
          healthyCount: plants.filter((p: Plant) => p.status === 'Healthy').length,
          warningCount: plants.filter((p: Plant) => p.status === 'Warning').length,
          criticalCount: plants.filter((p: Plant) => p.status === 'Critical').length,
          recentlyAdded: plants.filter((p: Plant) => p.createdAt > oneWeekAgo).length,
        };

        set({ stats });
      },

      getHealthySummary: () => {
        const plants = get().plants;
        return {
          healthy: plants.filter((p: Plant) => p.status === 'Healthy').length,
          warning: plants.filter((p: Plant) => p.status === 'Warning').length,
          critical: plants.filter((p: Plant) => p.status === 'Critical').length,
        };
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    })),
    {
      name: STORAGE_KEYS.PLANTS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plants: state.plants,
        filter: state.filter,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for version 0 -> 1
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);

// Computed selectors (optimized to prevent unnecessary re-renders)
export const useFilteredPlants = () => {
  return useGardenStore((state) => {
    let filtered = state.plants;

    // Apply status filter
    if (state.filter !== 'all') {
      filtered = filtered.filter(plant => plant.status === state.filter);
    }

    // Apply search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(plant =>
        plant.name.toLowerCase().includes(query) ||
        plant.scientificName?.toLowerCase().includes(query)
      );
    }

    // Sort by name by default
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  });
};

export const usePlantById = (id: string | null) => {
  return useGardenStore(
    (state) => id ? state.plants.find(p => p.id === id) || null : null
  );
};

export const useGardenStats = () => {
  return useGardenStore((state) => state.stats);
};

export const useHealthyPlantsCount = () => {
  return useGardenStore((state) => state.plants.filter((p: Plant) => p.status === 'Healthy').length);
};

// Actions for external use
export const gardenActions = {
  addPlant: (plant: CreatePlantInput) => useGardenStore.getState().addPlant(plant),
  updatePlant: (id: string, updates: UpdatePlantInput) => useGardenStore.getState().updatePlant(id, updates),
  deletePlant: (id: string) => useGardenStore.getState().deletePlant(id),
  selectPlant: (id: string | null) => useGardenStore.getState().selectPlant(id),
  loadPlants: () => useGardenStore.getState().loadPlants(),
  reset: () => useGardenStore.getState().reset(),
};