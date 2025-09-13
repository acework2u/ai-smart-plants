// Central export for all stores
export * from './garden';
export * from './activity';

// Store utilities and helpers
import { useGardenStore } from './garden';
import { useActivityStore } from './activity';

// Combined store actions for complex operations
export const combinedActions = {
  // Initialize app data
  initializeApp: async () => {
    await Promise.all([
      useGardenStore.getState().loadPlants(),
      useActivityStore.getState().calculateAllStats(),
    ]);
  },

  // Add plant with initial activity
  addPlantWithActivity: (plantInput: any, initialActivity?: any) => {
    useGardenStore.getState().addPlant(plantInput);

    if (initialActivity) {
      useActivityStore.getState().addActivity({
        ...initialActivity,
        plantId: plantInput.id,
      });
    }
  },

  // Delete plant and all associated data
  deletePlantCompletely: (plantId: string) => {
    useGardenStore.getState().deletePlant(plantId);
    useActivityStore.getState().clearPlantActivities(plantId);
  },

  // Reset all stores
  resetAllStores: () => {
    useGardenStore.getState().reset();
    useActivityStore.getState().reset();
  },

  // Export all data
  exportAllData: () => {
    const gardens = useGardenStore.getState().plants;
    const activities = useActivityStore.getState().activities;
    const plantPrefs = useActivityStore.getState().plantPrefs;

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      data: {
        gardens,
        activities,
        plantPrefs,
      },
    };
  },

  // Import all data
  importAllData: (data: any) => {
    try {
      if (data.data.gardens) {
        data.data.gardens.forEach((plant: any) => {
          useGardenStore.getState().addPlant(plant);
        });
      }

      if (data.data.activities) {
        Object.entries(data.data.activities).forEach(([plantId, activities]: [string, any]) => {
          useActivityStore.getState().importActivities(plantId, activities);
        });
      }

      if (data.data.plantPrefs) {
        Object.entries(data.data.plantPrefs).forEach(([plantId, prefs]: [string, any]) => {
          useActivityStore.getState().setPlantPrefs(plantId, prefs);
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  },
};

// Store health checks
export const storeHealthCheck = {
  checkGardenStore: () => {
    const state = useGardenStore.getState();
    return {
      plantsCount: state.plants.length,
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error && state.plants.length >= 0,
    };
  },

  checkActivityStore: () => {
    const state = useActivityStore.getState();
    const totalActivities = Object.values(state.activities).reduce(
      (sum, activities) => sum + activities.length, 0
    );

    return {
      totalActivities,
      plantsWithActivities: Object.keys(state.activities).length,
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error && totalActivities >= 0,
    };
  },

  checkAllStores: () => {
    return {
      garden: storeHealthCheck.checkGardenStore(),
      activity: storeHealthCheck.checkActivityStore(),
      overall: {
        timestamp: new Date(),
        allHealthy: storeHealthCheck.checkGardenStore().isHealthy &&
                   storeHealthCheck.checkActivityStore().isHealthy,
      },
    };
  },
};

// Development utilities
export const devUtils = {
  // Seed stores with sample data
  seedStores: () => {
    if (__DEV__) {
      // Sample plants
      const samplePlants = [
        {
          name: 'Monstera Deliciosa',
          scientificName: 'Monstera deliciosa',
          status: 'Healthy' as const,
          imageUrl: 'https://images.unsplash.com/photo-1614594857263-4a3b8d54915f?q=80&w=800',
        },
        {
          name: 'Snake Plant',
          scientificName: 'Sansevieria trifasciata',
          status: 'Warning' as const,
          imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a8d2ecf6?q=80&w=800',
        },
      ];

      samplePlants.forEach(plant => {
        useGardenStore.getState().addPlant(plant);
      });

      console.log('Stores seeded with sample data');
    }
  },

  // Clear all development data
  clearDevData: () => {
    if (__DEV__) {
      combinedActions.resetAllStores();
      console.log('All development data cleared');
    }
  },

  // Log store states
  logStoreStates: () => {
    if (__DEV__) {
      console.log('Garden Store:', useGardenStore.getState());
      console.log('Activity Store:', useActivityStore.getState());
      console.log('Store Health:', storeHealthCheck.checkAllStores());
    }
  },
};