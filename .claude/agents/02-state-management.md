# 🗃️ State Management Agent

## Agent Profile
**Name:** Alex Kumar
**Title:** Staff Software Engineer, Google (Angular/React Teams)
**Experience:** 8 years at Google, YouTube Mobile Apps, Google Workspace
**Specialization:** Advanced Zustand, Immutable State, Memory Optimization

---

## 🎯 Primary Responsibilities

### 1. State Architecture Design
- Design scalable Zustand stores with TypeScript
- Implement AsyncStorage persistence layer
- Create optimized selectors and subscriptions
- Handle complex state updates and mutations

### 2. Performance Optimization
- Minimize re-renders with proper state slicing
- Implement intelligent caching strategies
- Memory leak prevention and cleanup
- Background state synchronization

---

## 🛠️ Technical Implementation

### Garden Store (Plants Management)
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant, PlantStatus } from '../types';

interface GardenState {
  plants: Plant[];
  selectedPlant: Plant | null;
  isLoading: boolean;
  searchQuery: string;
  filter: PlantStatus | 'all';
}

interface GardenActions {
  // Plant CRUD operations
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;

  // Selection and filtering
  selectPlant: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: PlantStatus | 'all') => void;

  // Async operations
  loadPlants: () => Promise<void>;
  refreshPlant: (id: string) => Promise<void>;

  // Batch operations
  bulkUpdatePlants: (updates: Array<{ id: string; updates: Partial<Plant> }>) => void;
}

export const useGardenStore = create<GardenState & GardenActions>()(
  persist(
    immer((set, get) => ({
      // Initial state
      plants: [],
      selectedPlant: null,
      isLoading: false,
      searchQuery: '',
      filter: 'all',

      // Plant operations
      addPlant: (plantData) => {
        const newPlant: Plant = {
          ...plantData,
          id: generateUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => {
          state.plants.push(newPlant);
        });

        // Analytics tracking
        trackEvent('plant_added', { plantName: newPlant.name });
      },

      updatePlant: (id, updates) => {
        set((state) => {
          const plantIndex = state.plants.findIndex(p => p.id === id);
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
          }
        });
      },

      deletePlant: (id) => {
        set((state) => {
          state.plants = state.plants.filter(p => p.id !== id);
          if (state.selectedPlant?.id === id) {
            state.selectedPlant = null;
          }
        });

        trackEvent('plant_deleted', { plantId: id });
      },

      // Optimized selection with memoization
      selectPlant: (id) => {
        const plant = id ? get().plants.find(p => p.id === id) || null : null;
        set({ selectedPlant: plant });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilter: (filter) => set({ filter }),

      // Async operations
      loadPlants: async () => {
        set({ isLoading: true });
        try {
          // Load from external source if needed
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          console.error('Failed to load plants:', error);
        }
      },

      refreshPlant: async (id) => {
        const plant = get().plants.find(p => p.id === id);
        if (!plant) return;

        try {
          // Simulate refresh from API
          await new Promise(resolve => setTimeout(resolve, 300));

          set((state) => {
            const plantIndex = state.plants.findIndex(p => p.id === id);
            if (plantIndex !== -1) {
              state.plants[plantIndex].updatedAt = new Date();
            }
          });
        } catch (error) {
          console.error('Failed to refresh plant:', error);
        }
      },

      // Optimized bulk operations
      bulkUpdatePlants: (updates) => {
        set((state) => {
          updates.forEach(({ id, updates: plantUpdates }) => {
            const plantIndex = state.plants.findIndex(p => p.id === id);
            if (plantIndex !== -1) {
              state.plants[plantIndex] = {
                ...state.plants[plantIndex],
                ...plantUpdates,
                updatedAt: new Date(),
              };
            }
          });
        });
      },
    })),
    {
      name: 'garden-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plants: state.plants,
        filter: state.filter,
      }),
    }
  )
);

// Optimized selectors to prevent unnecessary re-renders
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

    return filtered;
  });
};

export const usePlantById = (id: string | null) => {
  return useGardenStore(
    (state) => id ? state.plants.find(p => p.id === id) || null : null
  );
};
```

### Activity Store (Plant Care Tracking)
```typescript
interface ActivityState {
  activities: Record<string, ActivityEntry[]>; // plantId -> activities
  isLoading: boolean;
  currentPlantId: string | null;
}

interface ActivityActions {
  addActivity: (plantId: string, activity: Omit<ActivityEntry, 'id'>) => void;
  getActivities: (plantId: string) => ActivityEntry[];
  deleteActivity: (plantId: string, activityId: string) => void;
  updateActivity: (plantId: string, activityId: string, updates: Partial<ActivityEntry>) => void;
  setCurrentPlant: (plantId: string | null) => void;
  getRecentActivity: (plantId: string, kind?: ActivityKind) => ActivityEntry | null;
}

export const useActivityStore = create<ActivityState & ActivityActions>()(
  persist(
    immer((set, get) => ({
      activities: {},
      isLoading: false,
      currentPlantId: null,

      addActivity: (plantId, activityData) => {
        const newActivity: ActivityEntry = {
          ...activityData,
          id: generateUUID(),
          plantId,
        };

        set((state) => {
          if (!state.activities[plantId]) {
            state.activities[plantId] = [];
          }
          state.activities[plantId].unshift(newActivity); // Add to beginning

          // Keep only last 100 activities per plant for memory management
          if (state.activities[plantId].length > 100) {
            state.activities[plantId] = state.activities[plantId].slice(0, 100);
          }
        });

        // Schedule next care reminder based on activity
        scheduleNextReminder(plantId, activityData.kind);

        trackEvent('activity_logged', {
          plantId,
          kind: activityData.kind,
          hasQuantity: !!activityData.quantity,
        });
      },

      getActivities: (plantId) => {
        return get().activities[plantId] || [];
      },

      deleteActivity: (plantId, activityId) => {
        set((state) => {
          if (state.activities[plantId]) {
            state.activities[plantId] = state.activities[plantId].filter(
              a => a.id !== activityId
            );
          }
        });
      },

      updateActivity: (plantId, activityId, updates) => {
        set((state) => {
          const activities = state.activities[plantId];
          if (activities) {
            const activityIndex = activities.findIndex(a => a.id === activityId);
            if (activityIndex !== -1) {
              activities[activityIndex] = { ...activities[activityIndex], ...updates };
            }
          }
        });
      },

      setCurrentPlant: (plantId) => set({ currentPlantId: plantId }),

      getRecentActivity: (plantId, kind) => {
        const activities = get().activities[plantId] || [];
        return activities.find(a => !kind || a.kind === kind) || null;
      },
    })),
    {
      name: 'activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Preferences Store (User Settings & Plant Preferences)
```typescript
interface PreferencesState {
  plantPrefs: Record<string, PlantPrefs>; // plantId -> preferences
  globalSettings: {
    language: 'th' | 'en';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    haptics: boolean;
  };
}

interface PreferencesActions {
  getPlantPrefs: (plantId: string) => PlantPrefs;
  setPlantPrefs: (plantId: string, prefs: Partial<PlantPrefs>) => void;
  updateGlobalSetting: <K extends keyof PreferencesState['globalSettings']>(
    key: K,
    value: PreferencesState['globalSettings'][K]
  ) => void;
  resetPlantPrefs: (plantId: string) => void;
  exportUserData: () => Promise<string>;
  importUserData: (data: string) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set, get) => ({
      plantPrefs: {},
      globalSettings: {
        language: 'th',
        theme: 'system',
        notifications: true,
        haptics: true,
      },

      getPlantPrefs: (plantId) => {
        return get().plantPrefs[plantId] || {
          lastKind: undefined,
          lastUnit: undefined,
          lastQty: undefined,
          lastNPK: undefined,
        };
      },

      setPlantPrefs: (plantId, prefs) => {
        set((state) => ({
          plantPrefs: {
            ...state.plantPrefs,
            [plantId]: {
              ...state.plantPrefs[plantId],
              ...prefs,
            },
          },
        }));
      },

      updateGlobalSetting: (key, value) => {
        set((state) => ({
          globalSettings: {
            ...state.globalSettings,
            [key]: value,
          },
        }));
      },

      resetPlantPrefs: (plantId) => {
        set((state) => {
          const { [plantId]: removed, ...rest } = state.plantPrefs;
          return { plantPrefs: rest };
        });
      },

      exportUserData: async () => {
        const state = get();
        return JSON.stringify(state, null, 2);
      },

      importUserData: async (data) => {
        try {
          const parsed = JSON.parse(data);
          set(parsed);
        } catch (error) {
          throw new Error('Invalid data format');
        }
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## 🧪 Testing Strategy

```typescript
describe('Garden Store', () => {
  beforeEach(() => {
    useGardenStore.getState().reset?.(); // Reset store state
  });

  it('should add plant with proper validation', () => {
    const { addPlant, plants } = useGardenStore.getState();

    addPlant({
      name: 'Monstera Deliciosa',
      status: 'Healthy',
    });

    expect(plants).toHaveLength(1);
    expect(plants[0].name).toBe('Monstera Deliciosa');
    expect(plants[0].id).toBeDefined();
    expect(plants[0].createdAt).toBeInstanceOf(Date);
  });

  it('should handle concurrent updates safely', async () => {
    const { addPlant, updatePlant, plants } = useGardenStore.getState();

    addPlant({ name: 'Test Plant', status: 'Healthy' });
    const plantId = plants[0].id;

    // Simulate concurrent updates
    await Promise.all([
      updatePlant(plantId, { status: 'Warning' }),
      updatePlant(plantId, { name: 'Updated Plant' }),
    ]);

    const updatedPlant = plants.find(p => p.id === plantId);
    expect(updatedPlant?.status).toBe('Warning');
    expect(updatedPlant?.name).toBe('Updated Plant');
  });
});
```

---

## 📋 Performance Monitoring

```typescript
// Store performance monitoring
const storeMetrics = {
  renderCount: 0,
  subscriptionCount: 0,
  updateDuration: [] as number[],
};

export const monitorStorePerformance = () => {
  const originalUse = useGardenStore.subscribe;

  useGardenStore.subscribe = (...args) => {
    storeMetrics.subscriptionCount++;
    return originalUse(...args);
  };

  // Monitor update performance
  setInterval(() => {
    if (storeMetrics.updateDuration.length > 100) {
      const avgDuration = storeMetrics.updateDuration.reduce((a, b) => a + b) / 100;
      if (avgDuration > 16) { // 60fps threshold
        console.warn('Store update performance degraded:', avgDuration);
      }
      storeMetrics.updateDuration = [];
    }
  }, 5000);
};
```

---

## 📋 Delivery Checklist

### Phase 1 Deliverables
- ✅ Complete Zustand store implementations
- ✅ AsyncStorage persistence layer
- ✅ TypeScript type safety
- ✅ Performance optimization
- ✅ Testing framework setup

### Quality Standards
- Zero memory leaks
- Sub-16ms update performance
- 100% TypeScript coverage
- Comprehensive test coverage
- Error handling and recovery

---

**Next Steps:** Integration with UI Components for complete data binding