// Central export for all stores
export * from './garden';
export * from './activity';
export * from './notifications';
export * from './preferences';
export * from './analysis';
export * from './userStore';
export * from './insightsStore';

// Store utilities and helpers
import { useGardenStore } from './garden';
import { generateId } from '../utils/ids';
import { useActivityStore } from './activity';
import { useNotificationStore } from './notifications';
import { usePreferencesStore } from './preferences';
import { useAnalysisStore } from './analysis';
import { useUserStore } from './userStore';
import { useInsightsStore, initializeInsightsStore, cleanupInsightsStore } from './insightsStore';

// Combined store actions for complex operations
export const combinedActions = {
  // Initialize app data
  initializeApp: async () => {
    await Promise.all([
      useGardenStore.getState().loadPlants(),
      useActivityStore.getState().calculateAllStats(),
      useNotificationStore.getState().calculateStats(),
      useAnalysisStore.getState().cleanupOldCache(),
    ]);

    // Initialize insights store with background tasks and cache warmup
    initializeInsightsStore();

    // Update user last seen
    useUserStore.getState().updateLastSeen();
  },

  // Add plant with initial activity
  addPlantWithActivity: (plantInput: any, initialActivity?: any) => {
    const plantId = generateId();
    const plantData = { ...plantInput, id: plantId };

    useGardenStore.getState().addPlant(plantData);

    // Update user statistics
    useUserStore.getState().incrementPlantCount();

    if (initialActivity) {
      useActivityStore.getState().addActivity({
        ...initialActivity,
        plantId: plantId,
      });

      // This will automatically increment activity count via the activity store
      useUserStore.getState().incrementActivityCount();

      // Update insights store dependency for activity data
      useInsightsStore.getState().updateDependency('activityData');
    }

    // Update insights store dependency for plant data
    useInsightsStore.getState().updateDependency('plantData');

    return plantId;
  },

  // Complete camera → AI → garden workflow
  processScanResult: async (imageUri: string, customName?: string) => {
    try {
      // Start AI analysis
      const analysisResponse = await useAnalysisStore.getState().startAnalysis(imageUri);

      if (!analysisResponse.success || !analysisResponse.analysis) {
        throw new Error(analysisResponse.error?.message || 'Analysis failed');
      }

      const analysis = analysisResponse.analysis;

      // Save to garden
      const plantId = useGardenStore.getState().addPlantFromScan({
        name: customName || analysis.plantNameThai || analysis.plantName,
        scientificName: analysis.scientificName,
        status: analysis.healthStatus,
        imageUrl: imageUri,
      }, analysis.analysisId);

      // Update user statistics
      useUserStore.getState().incrementPlantCount();

      // Award achievement for using AI scanning
      useUserStore.getState().addAchievement({
        name: 'AI Scanner',
        description: 'Used AI to identify a plant',
        icon: '🤖',
        category: 'achievement',
        rarity: 'common',
      });

      // Create AI tip notifications
      if (analysis.urgentActions && analysis.urgentActions.length > 0) {
        analysis.urgentActions.forEach((action, index) => {
          useNotificationStore.getState().addNotification({
            type: 'ai',
            priority: 'high',
            title: 'การดูแลด่วน',
            detail: action,
            timeLabel: 'เมื่อกี้นี้',
            plantId: plantId,
            read: false,
          });
        });
      }

      // Create care recommendations as notifications
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        analysis.recommendations.slice(0, 2).forEach((rec, index) => {
          useNotificationStore.getState().addNotification({
            type: 'ai',
            priority: rec.priority >= 4 ? 'high' : 'medium',
            title: rec.title,
            detail: rec.description,
            timeLabel: 'เมื่อกี้นี้',
            plantId: plantId,
            actionUrl: `/plant/${plantId}`,
            read: false,
          });
        });
      }

      // Update plant preferences with analysis insights
      if (analysis.watering) {
        usePreferencesStore.getState().updatePreferredUnits(
          plantId,
          analysis.watering.amount.includes('ml') ? 'ml' : 'ล.',
          'ml'
        );
      }

      console.log('Scan result processed successfully:', plantId);
      return { success: true, plantId, analysis };

    } catch (error) {
      console.error('Failed to process scan result:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  },

  // Delete plant and all associated data
  deletePlantCompletely: (plantId: string) => {
    useGardenStore.getState().deletePlant(plantId);
    useActivityStore.getState().clearPlantActivities(plantId);
    usePreferencesStore.getState().deletePlantPrefs(plantId);
    // Remove plant-specific notifications
    const notifications = useNotificationStore.getState().getNotificationsByPlant(plantId);
    notifications.forEach(n => useNotificationStore.getState().deleteNotification(n.id));

    // Clear plant-specific insights cache
    useInsightsStore.getState().clearCache(plantId);
    useInsightsStore.getState().updateDependency('plantData');
    useInsightsStore.getState().updateDependency('activityData');
  },

  // Reset all stores
  resetAllStores: () => {
    // Clean up insights store background tasks first
    cleanupInsightsStore();

    useGardenStore.getState().reset();
    useActivityStore.getState().reset();
    useNotificationStore.getState().reset();
    usePreferencesStore.getState().reset();
    useAnalysisStore.getState().reset();
    useUserStore.getState().reset();
    useInsightsStore.getState().reset();
  },

  // Export all data
  exportAllData: () => {
    const gardens = useGardenStore.getState().plants;
    const activities = useActivityStore.getState().activities;
    const notifications = useNotificationStore.getState().notifications;
    const plantPrefs = usePreferencesStore.getState().plantPrefs;
    const userPrefs = usePreferencesStore.getState().userPrefs;
    const analysisHistory = useAnalysisStore.getState().analysisHistory;
    const userData = useUserStore.getState().exportUserData();

    return {
      version: '2.1.0',
      exportDate: new Date().toISOString(),
      data: {
        gardens,
        activities,
        notifications: notifications.slice(0, 50), // Only recent notifications
        plantPrefs,
        userPrefs,
        analysisHistory: analysisHistory.slice(0, 20), // Only recent analysis
        user: userData,
      },
    };
  },

  // Import all data
  importAllData: (data: any) => {
    try {
      // Import gardens
      if (data.data.gardens) {
        data.data.gardens.forEach((plant: any) => {
          useGardenStore.getState().addPlant(plant);
        });
      }

      // Import activities
      if (data.data.activities) {
        Object.entries(data.data.activities).forEach(([plantId, activities]: [string, any]) => {
          useActivityStore.getState().importActivities(plantId, activities);
        });
      }

      // Import notifications
      if (data.data.notifications) {
        data.data.notifications.forEach((notification: any) => {
          useNotificationStore.getState().addNotification(notification);
        });
      }

      // Import plant preferences
      if (data.data.plantPrefs) {
        usePreferencesStore.getState().importPlantPrefs(data.data.plantPrefs);
      }

      // Import user preferences
      if (data.data.userPrefs) {
        usePreferencesStore.getState().setUserPrefs(data.data.userPrefs);
      }

      // Import analysis history
      if (data.data.analysisHistory) {
        data.data.analysisHistory.forEach((analysis: any) => {
          useAnalysisStore.getState().saveAnalysisResult(analysis);
        });
      }

      // Import user data
      if (data.data.user) {
        useUserStore.getState().importUserData(data.data.user);
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

  checkNotificationStore: () => {
    const state = useNotificationStore.getState();
    return {
      totalNotifications: state.notifications.length,
      unreadCount: state.getUnreadCount(),
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error && state.notifications.length >= 0,
    };
  },

  checkPreferencesStore: () => {
    const state = usePreferencesStore.getState();
    return {
      plantPrefsCount: Object.keys(state.plantPrefs).length,
      hasUserPrefs: !!state.userPrefs,
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error,
    };
  },

  checkAnalysisStore: () => {
    const state = useAnalysisStore.getState();
    return {
      analysisHistoryCount: state.analysisHistory.length,
      cacheSize: Object.keys(state.analysisCache).length,
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error,
    };
  },

  checkUserStore: () => {
    const state = useUserStore.getState();
    return {
      hasUser: !!state.user,
      isInitialized: state.isInitialized,
      badgesCount: state.user?.badges.length || 0,
      milestonesCount: state.user?.milestones.length || 0,
      expertLevel: state.user?.statistics.expertLevel || 'Unknown',
      hasError: !!state.error,
      lastUpdated: state.lastUpdated,
      isHealthy: !state.error && state.isInitialized,
    };
  },

  checkInsightsStore: () => {
    const state = useInsightsStore.getState();
    const performance = state.getPerformanceReport();

    return {
      cacheSize: performance.cacheSize,
      cacheHitRate: performance.cacheHitRate,
      backgroundTasksActive: performance.backgroundTasksActive,
      memoryUsage: performance.memoryUsage,
      totalComputations: performance.totalComputations,
      averageComputationTime: performance.averageComputationTime,
      hasError: !!state.error,
      isHealthy: !state.error && performance.cacheHitRate >= 0,
    };
  },

  checkAllStores: () => {
    const garden = storeHealthCheck.checkGardenStore();
    const activity = storeHealthCheck.checkActivityStore();
    const notifications = storeHealthCheck.checkNotificationStore();
    const preferences = storeHealthCheck.checkPreferencesStore();
    const analysis = storeHealthCheck.checkAnalysisStore();
    const user = storeHealthCheck.checkUserStore();
    const insights = storeHealthCheck.checkInsightsStore();

    return {
      garden,
      activity,
      notifications,
      preferences,
      analysis,
      user,
      insights,
      overall: {
        timestamp: new Date(),
        allHealthy: garden.isHealthy && activity.isHealthy &&
                   notifications.isHealthy && preferences.isHealthy &&
                   analysis.isHealthy && user.isHealthy && insights.isHealthy,
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

      // Create sample user if none exists
      if (!useUserStore.getState().user) {
        useUserStore.getState().createDefaultUser('Plant Developer', 'dev@smartplant.app');
      }

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
      console.log('User Store:', useUserStore.getState());
      console.log('Store Health:', storeHealthCheck.checkAllStores());
    }
  },
};
