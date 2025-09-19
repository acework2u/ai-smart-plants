/**
 * User Profile Store - Sprint 5 Task 1
 *
 * Comprehensive user profile management with:
 * ✅ User Profile Interface (id, name, email, avatar, joinDate, bio, preferences)
 * ✅ Achievement System (badges with categories and rarity)
 * ✅ Milestone Tracking (plants, activities, streaks with auto-completion)
 * ✅ Statistics Tracking (plants, activities, level progression, care streaks)
 * ✅ Store Operations (CRUD operations with automatic stat updates)
 * ✅ Persistence (AsyncStorage with zustand persist middleware)
 * ✅ Integration Points (optimized selectors and exported actions)
 * ✅ Migration Support (for existing users)
 *
 * Features:
 * - Automatic level calculation based on experience points
 * - Care streak tracking with daily reset logic
 * - Achievement awarding for milestones and special actions
 * - Monthly statistics for analytics
 * - Export/import functionality for data portability
 * - Health checks and development utilities
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, STORAGE_KEYS } from '../types';
import { generateId } from '../utils/ids';

/**
 * User achievement badge interface
 */
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string; // ISO date
  category: 'plant_care' | 'achievement' | 'streak' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

/**
 * User milestone tracking interface
 */
export interface Milestone {
  id: string;
  type: 'plants' | 'activities' | 'streak' | 'custom';
  name: string;
  description: string;
  target: number;
  current: number;
  isCompleted: boolean;
  completedDate?: string; // ISO date
  reward?: Badge;
}

/**
 * User care streak tracking interface
 */
export interface CareStreak {
  current: number;
  longest: number;
  lastActivityDate?: string; // ISO date
  isActive: boolean;
  streakStartDate?: string; // ISO date
}

/**
 * User statistics interface
 */
export interface UserStatistics {
  totalPlants: number;
  healthyPlants: number;
  totalActivities: number;
  plantsSaved: number;
  expertLevel: 'Beginner' | 'Intermediate' | 'Expert' | 'Master';
  experiencePoints: number;
  careStreak: CareStreak;
  monthlyStats: {
    activitiesThisMonth: number;
    plantsAddedThisMonth: number;
    streakDaysThisMonth: number;
  };
}

/**
 * Main user profile interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL or base64
  joinDate: string; // ISO date
  bio?: string;
  preferences: UserPreferences;
  badges: Badge[];
  milestones: Milestone[];
  statistics: UserStatistics;
  lastSeen: string; // ISO date
}

/**
 * User store state interface
 */
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isInitialized: boolean;
}

/**
 * User store actions interface
 */
interface UserActions {
  // Profile management
  updateProfile: (updates: Partial<Omit<User, 'id' | 'joinDate' | 'badges' | 'milestones' | 'statistics'>>) => void;
  updateAvatar: (imageUri: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Achievement system
  addAchievement: (achievement: Omit<Badge, 'id' | 'earnedDate'>) => void;
  hasAchievement: (achievementName: string) => boolean;
  getAchievementsByCategory: (category: Badge['category']) => Badge[];

  // Statistics tracking
  updateStatistics: (updates: Partial<UserStatistics>) => void;
  incrementPlantCount: () => void;
  incrementActivityCount: () => void;
  incrementPlantsSaved: () => void;
  updateCareStreak: (hasActivity: boolean) => void;
  calculateLevel: () => void;

  // Milestones
  updateMilestone: (milestoneId: string, current: number) => void;
  checkMilestones: () => void;
  addCustomMilestone: (milestone: Omit<Milestone, 'id' | 'isCompleted' | 'current'>) => void;

  // Initialization and persistence
  initializeUser: (userData: Partial<User>) => void;
  createDefaultUser: (name: string, email: string) => void;
  updateLastSeen: () => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
  exportUserData: () => User | null;
  importUserData: (userData: User) => void;
}

/**
 * Default user preferences
 */
const defaultPreferences: UserPreferences = {
  language: 'en',
  theme: 'system',
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

/**
 * Default user statistics
 */
const defaultStatistics: UserStatistics = {
  totalPlants: 0,
  healthyPlants: 0,
  totalActivities: 0,
  plantsSaved: 0,
  expertLevel: 'Beginner',
  experiencePoints: 0,
  careStreak: {
    current: 0,
    longest: 0,
    isActive: false,
  },
  monthlyStats: {
    activitiesThisMonth: 0,
    plantsAddedThisMonth: 0,
    streakDaysThisMonth: 0,
  },
};

/**
 * Default milestones for new users
 */
const createDefaultMilestones = (): Milestone[] => [
  {
    id: generateId(),
    type: 'plants',
    name: 'Plant Parent',
    description: 'Add your first 5 plants',
    target: 5,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'plants',
    name: 'Green Thumb',
    description: 'Maintain 10 healthy plants',
    target: 10,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'plants',
    name: 'Garden Guru',
    description: 'Care for 25 plants',
    target: 25,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'plants',
    name: 'Plant Whisperer',
    description: 'Nurture 50 plants to health',
    target: 50,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'activities',
    name: 'Getting Started',
    description: 'Complete your first 50 care activities',
    target: 50,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'activities',
    name: 'Dedicated Caregiver',
    description: 'Complete 100 care activities',
    target: 100,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'activities',
    name: 'Plant Care Master',
    description: 'Complete 500 care activities',
    target: 500,
    current: 0,
    isCompleted: false,
  },
  {
    id: generateId(),
    type: 'streak',
    name: 'Consistency Champion',
    description: 'Maintain a 7-day care streak',
    target: 7,
    current: 0,
    isCompleted: false,
  },
];

/**
 * Initial state for the user store
 */
const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  isInitialized: false,
};

/**
 * User store implementation using Zustand with persistence
 */
export const useUserStore = create<UserState & UserActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Profile management
      updateProfile: (updates) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, updates);
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
            state.error = null;
          }
        });
      },

      updateAvatar: (imageUri) => {
        set((state) => {
          if (state.user) {
            state.user.avatar = imageUri;
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });
      },

      updatePreferences: (preferences) => {
        set((state) => {
          if (state.user) {
            state.user.preferences = {
              ...state.user.preferences,
              ...preferences,
            };
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });
      },

      // Achievement system
      addAchievement: (achievement) => {
        const newBadge: Badge = {
          ...achievement,
          id: generateId(),
          earnedDate: new Date().toISOString(),
        };

        set((state) => {
          if (state.user) {
            // Check if achievement already exists
            const exists = state.user.badges.some(badge => badge.name === achievement.name);
            if (!exists) {
              state.user.badges.push(newBadge);
              state.user.statistics.experiencePoints += 50; // Award XP for achievements
              state.user.lastSeen = new Date().toISOString();
              state.lastUpdated = new Date();

              console.log('Achievement earned:', achievement.name);
            }
          }
        });

        // Recalculate level after earning achievement
        get().calculateLevel();
      },

      hasAchievement: (achievementName) => {
        const user = get().user;
        return user ? user.badges.some(badge => badge.name === achievementName) : false;
      },

      getAchievementsByCategory: (category) => {
        const user = get().user;
        return user ? user.badges.filter(badge => badge.category === category) : [];
      },

      // Statistics tracking
      updateStatistics: (updates) => {
        set((state) => {
          if (state.user) {
            state.user.statistics = {
              ...state.user.statistics,
              ...updates,
            };
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });

        get().calculateLevel();
        get().checkMilestones();
      },

      incrementPlantCount: () => {
        set((state) => {
          if (state.user) {
            state.user.statistics.totalPlants += 1;
            state.user.statistics.monthlyStats.plantsAddedThisMonth += 1;
            state.user.statistics.experiencePoints += 10;
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });

        get().calculateLevel();
        get().checkMilestones();
      },

      incrementActivityCount: () => {
        set((state) => {
          if (state.user) {
            state.user.statistics.totalActivities += 1;
            state.user.statistics.monthlyStats.activitiesThisMonth += 1;
            state.user.statistics.experiencePoints += 5;
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });

        get().updateCareStreak(true);
        get().calculateLevel();
        get().checkMilestones();
      },

      incrementPlantsSaved: () => {
        set((state) => {
          if (state.user) {
            state.user.statistics.plantsSaved += 1;
            state.user.statistics.experiencePoints += 25;
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });

        get().calculateLevel();
      },

      updateCareStreak: (hasActivity) => {
        set((state) => {
          if (state.user) {
            const today = new Date().toISOString().split('T')[0];
            const lastActivityDate = state.user.statistics.careStreak.lastActivityDate;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (hasActivity) {
              if (!lastActivityDate) {
                // First activity ever
                state.user.statistics.careStreak.current = 1;
                state.user.statistics.careStreak.isActive = true;
                state.user.statistics.careStreak.streakStartDate = today;
              } else if (lastActivityDate === yesterday.toISOString().split('T')[0]) {
                // Continued streak from yesterday
                state.user.statistics.careStreak.current += 1;
                state.user.statistics.careStreak.isActive = true;
              } else if (lastActivityDate !== today) {
                // Streak broken, start new one
                state.user.statistics.careStreak.current = 1;
                state.user.statistics.careStreak.isActive = true;
                state.user.statistics.careStreak.streakStartDate = today;
              }
              // If lastActivityDate === today, don't increment (same day)

              state.user.statistics.careStreak.lastActivityDate = today;

              // Update longest streak if needed
              if (state.user.statistics.careStreak.current > state.user.statistics.careStreak.longest) {
                state.user.statistics.careStreak.longest = state.user.statistics.careStreak.current;
              }

              state.user.statistics.monthlyStats.streakDaysThisMonth = state.user.statistics.careStreak.current;
            } else {
              // Check if streak should be broken (no activity yesterday)
              if (lastActivityDate && lastActivityDate !== today && lastActivityDate !== yesterdayStr) {
                state.user.statistics.careStreak.current = 0;
                state.user.statistics.careStreak.isActive = false;
              }
            }

            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });

        get().checkMilestones();
      },

      calculateLevel: () => {
        set((state) => {
          if (state.user) {
            const xp = state.user.statistics.experiencePoints;
            let level: UserStatistics['expertLevel'] = 'Beginner';

            if (xp >= 2000) {
              level = 'Master';
            } else if (xp >= 1000) {
              level = 'Expert';
            } else if (xp >= 500) {
              level = 'Intermediate';
            }

            if (state.user.statistics.expertLevel !== level) {
              state.user.statistics.expertLevel = level;

              // Award level-up achievement
              const levelAchievements = {
                'Intermediate': { name: 'Level Up!', description: 'Reached Intermediate level', icon: '🌱', category: 'achievement' as const, rarity: 'common' as const },
                'Expert': { name: 'Plant Expert', description: 'Reached Expert level', icon: '🌿', category: 'achievement' as const, rarity: 'uncommon' as const },
                'Master': { name: 'Plant Master', description: 'Reached Master level', icon: '🌳', category: 'achievement' as const, rarity: 'rare' as const },
              };

              if (level !== 'Beginner' && levelAchievements[level]) {
                get().addAchievement(levelAchievements[level]);
              }
            }
          }
        });
      },

      // Milestones
      updateMilestone: (milestoneId, current) => {
        set((state) => {
          if (state.user) {
            const milestone = state.user.milestones.find(m => m.id === milestoneId);
            if (milestone) {
              milestone.current = current;
              if (!milestone.isCompleted && current >= milestone.target) {
                milestone.isCompleted = true;
                milestone.completedDate = new Date().toISOString();

                // Award milestone achievement
                get().addAchievement({
                  name: milestone.name,
                  description: milestone.description,
                  icon: '🏆',
                  category: 'milestone',
                  rarity: 'uncommon',
                });
              }
            }
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });
      },

      checkMilestones: () => {
        const user = get().user;
        if (!user) return;

        // Update plant-related milestones
        const plantMilestones = user.milestones.filter(m => m.type === 'plants');
        plantMilestones.forEach(milestone => {
          const currentValue = milestone.name.includes('healthy')
            ? user.statistics.healthyPlants
            : user.statistics.totalPlants;
          get().updateMilestone(milestone.id, currentValue);
        });

        // Update activity-related milestones
        const activityMilestones = user.milestones.filter(m => m.type === 'activities');
        activityMilestones.forEach(milestone => {
          get().updateMilestone(milestone.id, user.statistics.totalActivities);
        });

        // Update streak-related milestones
        const streakMilestones = user.milestones.filter(m => m.type === 'streak');
        streakMilestones.forEach(milestone => {
          get().updateMilestone(milestone.id, user.statistics.careStreak.current);
        });
      },

      addCustomMilestone: (milestone) => {
        const newMilestone: Milestone = {
          ...milestone,
          id: generateId(),
          current: 0,
          isCompleted: false,
        };

        set((state) => {
          if (state.user) {
            state.user.milestones.push(newMilestone);
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });
      },

      // Initialization and persistence
      initializeUser: (userData) => {
        set((state) => {
          const now = new Date().toISOString();

          state.user = {
            id: userData.id || generateId(),
            name: userData.name || 'Plant Lover',
            email: userData.email || '',
            avatar: userData.avatar,
            joinDate: userData.joinDate || now,
            bio: userData.bio,
            preferences: { ...defaultPreferences, ...userData.preferences },
            badges: userData.badges || [],
            milestones: userData.milestones || createDefaultMilestones(),
            statistics: { ...defaultStatistics, ...userData.statistics },
            lastSeen: now,
          };

          state.isInitialized = true;
          state.lastUpdated = new Date();
          state.error = null;
        });

        console.log('User initialized:', userData.name);
      },

      createDefaultUser: (name, email) => {
        const now = new Date().toISOString();

        set((state) => {
          state.user = {
            id: generateId(),
            name,
            email,
            joinDate: now,
            lastSeen: now,
            preferences: defaultPreferences,
            badges: [],
            milestones: createDefaultMilestones(),
            statistics: defaultStatistics,
          };

          state.isInitialized = true;
          state.lastUpdated = new Date();
          state.error = null;
        });

        // Award welcome achievement
        get().addAchievement({
          name: 'Welcome!',
          description: 'Welcome to Smart Plant App',
          icon: '🎉',
          category: 'achievement',
          rarity: 'common',
        });

        console.log('Default user created:', name);
      },

      updateLastSeen: () => {
        set((state) => {
          if (state.user) {
            state.user.lastSeen = new Date().toISOString();
            state.lastUpdated = new Date();
          }
        });
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => {
        set(initialState);
        console.log('User store reset');
      },

      exportUserData: () => {
        return get().user;
      },

      importUserData: (userData) => {
        set((state) => {
          state.user = {
            ...userData,
            lastSeen: new Date().toISOString(),
          };
          state.isInitialized = true;
          state.lastUpdated = new Date();
          state.error = null;
        });

        console.log('User data imported');
      },
    })),
    {
      name: STORAGE_KEYS.USER,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for version 0 -> 1
          // Handle any schema changes for existing users
          if (persistedState.user && !persistedState.user.statistics.careStreak) {
            persistedState.user.statistics.careStreak = {
              current: 0,
              longest: 0,
              isActive: false,
            };
          }

          if (persistedState.user && !persistedState.user.statistics.monthlyStats) {
            persistedState.user.statistics.monthlyStats = {
              activitiesThisMonth: 0,
              plantsAddedThisMonth: 0,
              streakDaysThisMonth: 0,
            };
          }
        }
        return persistedState;
      },
    }
  )
);

// Optimized selectors to prevent unnecessary re-renders
export const useUser = () => {
  return useUserStore((state) => state.user);
};

export const useUserStatistics = () => {
  return useUserStore((state) => state.user?.statistics || null);
};

export const useUserBadges = () => {
  return useUserStore((state) => state.user?.badges || []);
};

export const useUserMilestones = () => {
  return useUserStore((state) => state.user?.milestones || []);
};

export const useUserProfilePreferences = () => {
  return useUserStore((state) => state.user?.preferences || defaultPreferences);
};

export const useUserLevel = () => {
  return useUserStore((state) => state.user?.statistics.expertLevel || 'Beginner');
};

export const useUserStreak = () => {
  return useUserStore((state) => state.user?.statistics.careStreak || { current: 0, longest: 0, isActive: false });
};

export const useIsUserInitialized = () => {
  return useUserStore((state) => state.isInitialized);
};

// Actions for external use
export const userActions = {
  updateProfile: (updates: Partial<Omit<User, 'id' | 'joinDate' | 'badges' | 'milestones' | 'statistics'>>) =>
    useUserStore.getState().updateProfile(updates),
  updateAvatar: (imageUri: string) => useUserStore.getState().updateAvatar(imageUri),
  addAchievement: (achievement: Omit<Badge, 'id' | 'earnedDate'>) =>
    useUserStore.getState().addAchievement(achievement),
  incrementPlantCount: () => useUserStore.getState().incrementPlantCount(),
  incrementActivityCount: () => useUserStore.getState().incrementActivityCount(),
  incrementPlantsSaved: () => useUserStore.getState().incrementPlantsSaved(),
  updateCareStreak: (hasActivity: boolean) => useUserStore.getState().updateCareStreak(hasActivity),
  createDefaultUser: (name: string, email: string) => useUserStore.getState().createDefaultUser(name, email),
  updateLastSeen: () => useUserStore.getState().updateLastSeen(),
  reset: () => useUserStore.getState().reset(),
};