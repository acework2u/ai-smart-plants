import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotiItem,
  CreateNotificationInput,
  NotiType,
  NotiPriority,
  NotificationFilter,
  NotificationStats,
  NotificationPreferences,
  ReminderConfig,
  STORAGE_KEYS
} from '../types';

interface NotificationState {
  notifications: NotiItem[];
  isLoading: boolean;
  error: string | null;
  filter: NotiType | 'all';
  preferences: NotificationPreferences;
  reminders: ReminderConfig[];
  stats: NotificationStats | null;
  lastUpdated: Date | null;
}

interface NotificationActions {
  // Notification CRUD operations
  addNotification: (notification: CreateNotificationInput) => void;
  updateNotification: (id: string, updates: Partial<NotiItem>) => void;
  deleteNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;

  // Notification retrieval and filtering
  getNotifications: (filter?: NotificationFilter) => NotiItem[];
  getUnreadCount: () => number;
  getNotificationsByType: (type: NotiType) => NotiItem[];
  getNotificationsByPlant: (plantId: string) => NotiItem[];

  // Filter management (persisted)
  setFilter: (filter: NotiType | 'all') => void;
  getFilteredNotifications: () => NotiItem[];

  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;

  // Reminder management
  addReminder: (reminder: ReminderConfig) => void;
  updateReminder: (plantId: string, activityKind: string, updates: Partial<ReminderConfig>) => void;
  deleteReminder: (plantId: string, activityKind: string) => void;
  getPlantReminders: (plantId: string) => ReminderConfig[];

  // Statistics
  calculateStats: () => void;
  getStats: () => NotificationStats | null;

  // Cleanup and maintenance
  cleanupExpired: () => void;
  clearOldNotifications: (daysOld?: number) => void;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  types: {
    reminder: true,
    ai: true,
    alert: true,
    achievement: true,
    system: false,
  },
  timing: {
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    preferredTime: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  delivery: {
    push: true,
    sound: true,
    vibration: true,
    badge: true,
  },
};

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  filter: 'all',
  preferences: defaultPreferences,
  reminders: [],
  stats: null,
  lastUpdated: null,
};

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Notification CRUD operations
      addNotification: (notificationInput) => {
        const newNotification: NotiItem = {
          ...notificationInput,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          read: notificationInput.read || false,
        };

        set((state) => {
          // Add to beginning (most recent first)
          state.notifications.unshift(newNotification);

          // Keep only last 200 notifications for performance
          if (state.notifications.length > 200) {
            state.notifications = state.notifications.slice(0, 200);
          }

          state.lastUpdated = new Date();
          state.error = null;
        });

        get().calculateStats();

        // Analytics tracking
        console.log('Notification added:', newNotification.type, newNotification.title);
      },

      updateNotification: (id, updates) => {
        set((state) => {
          const notificationIndex = state.notifications.findIndex((n: NotiItem) => n.id === id);
          if (notificationIndex !== -1) {
            state.notifications[notificationIndex] = {
              ...state.notifications[notificationIndex],
              ...updates,
            };
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats();
      },

      deleteNotification: (id) => {
        set((state) => {
          state.notifications = state.notifications.filter((n: NotiItem) => n.id !== id);
          state.lastUpdated = new Date();
        });

        get().calculateStats();
      },

      markAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find((n: NotiItem) => n.id === id);
          if (notification && !notification.read) {
            notification.read = true;
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats();
      },

      markAllAsRead: () => {
        set((state) => {
          let hasChanges = false;
          state.notifications.forEach((notification) => {
            if (!notification.read) {
              notification.read = true;
              hasChanges = true;
            }
          });

          if (hasChanges) {
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats();
      },

      // Notification retrieval and filtering
      getNotifications: (filter) => {
        const notifications = get().notifications;

        if (!filter) return notifications;

        let filtered = notifications;

        // Filter by types
        if (filter.types && filter.types.length > 0) {
          filtered = filtered.filter(n => filter.types!.includes(n.type));
        }

        // Filter by priorities
        if (filter.priorities && filter.priorities.length > 0) {
          filtered = filtered.filter(n => filter.priorities!.includes(n.priority));
        }

        // Filter by read status
        if (filter.read !== undefined) {
          filtered = filtered.filter(n => n.read === filter.read);
        }

        // Filter by plant ID
        if (filter.plantId) {
          filtered = filtered.filter(n => n.plantId === filter.plantId);
        }

        // Filter by date range
        if (filter.dateRange) {
          const { start, end } = filter.dateRange;
          filtered = filtered.filter(n => {
            const createdAt = n.createdAt;
            return createdAt >= start && createdAt <= end;
          });
        }

        return filtered;
      },

      getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type);
      },

      getNotificationsByPlant: (plantId) => {
        return get().notifications.filter(n => n.plantId === plantId);
      },

      // Filter management (persisted)
      setFilter: (filter) => {
        set({ filter });
      },

      getFilteredNotifications: () => {
        const { notifications, filter } = get();

        if (filter === 'all') {
          return notifications;
        }

        return notifications.filter(n => n.type === filter);
      },

      // Preferences
      updatePreferences: (preferences) => {
        set((state) => {
          state.preferences = {
            ...state.preferences,
            ...preferences,
          };
        });
      },

      resetPreferences: () => {
        set({ preferences: defaultPreferences });
      },

      // Reminder management
      addReminder: (reminder) => {
        set((state) => {
          // Remove existing reminder for same plant/activity
          state.reminders = state.reminders.filter(
            r => !(r.plantId === reminder.plantId && r.activityKind === reminder.activityKind)
          );
          // Add new reminder
          state.reminders.push(reminder);
          state.lastUpdated = new Date();
        });
      },

      updateReminder: (plantId, activityKind, updates) => {
        set((state) => {
          const reminderIndex = state.reminders.findIndex(
            r => r.plantId === plantId && r.activityKind === activityKind
          );
          if (reminderIndex !== -1) {
            state.reminders[reminderIndex] = {
              ...state.reminders[reminderIndex],
              ...updates,
            };
            state.lastUpdated = new Date();
          }
        });
      },

      deleteReminder: (plantId, activityKind) => {
        set((state) => {
          state.reminders = state.reminders.filter(
            r => !(r.plantId === plantId && r.activityKind === activityKind)
          );
          state.lastUpdated = new Date();
        });
      },

      getPlantReminders: (plantId) => {
        return get().reminders.filter(r => r.plantId === plantId);
      },

      // Statistics
      calculateStats: () => {
        const notifications = get().notifications;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Count by type
        const byType: Record<NotiType, number> = {
          reminder: 0,
          ai: 0,
          alert: 0,
          achievement: 0,
          system: 0,
        };

        // Count by priority
        const byPriority: Record<NotiPriority, number> = {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        };

        let unread = 0;
        let todayCount = 0;
        let weekCount = 0;

        notifications.forEach(notification => {
          // Count by type
          byType[notification.type]++;

          // Count by priority
          byPriority[notification.priority]++;

          // Count unread
          if (!notification.read) {
            unread++;
          }

          // Count today's notifications
          if (notification.createdAt >= today) {
            todayCount++;
          }

          // Count week's notifications
          if (notification.createdAt >= oneWeekAgo) {
            weekCount++;
          }
        });

        const stats: NotificationStats = {
          total: notifications.length,
          unread,
          byType,
          byPriority,
          todayCount,
          weekCount,
        };

        set({ stats });
      },

      getStats: () => get().stats,

      // Cleanup and maintenance
      cleanupExpired: () => {
        const now = new Date();
        set((state) => {
          const initialLength = state.notifications.length;
          state.notifications = state.notifications.filter(
            n => !n.expiresAt || n.expiresAt > now
          );

          if (state.notifications.length !== initialLength) {
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats();
      },

      clearOldNotifications: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        set((state) => {
          const initialLength = state.notifications.length;
          // Keep unread notifications regardless of age
          state.notifications = state.notifications.filter(
            n => !n.read || n.createdAt > cutoffDate
          );

          if (state.notifications.length !== initialLength) {
            state.lastUpdated = new Date();
          }
        });

        get().calculateStats();
      },

      // Utility actions
      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    })),
    {
      name: STORAGE_KEYS.NOTIFICATIONS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        filter: state.filter,
        preferences: state.preferences,
        reminders: state.reminders,
        stats: state.stats,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
    }
  )
);

// Optimized selectors
export const useFilteredNotifications = () => {
  return useNotificationStore((state) => state.getFilteredNotifications());
};

export const useUnreadNotificationsCount = () => {
  return useNotificationStore((state) => state.getUnreadCount());
};

export const useNotificationsByType = (type: NotiType) => {
  return useNotificationStore((state) => state.getNotificationsByType(type));
};

export const useNotificationsByPlant = (plantId: string) => {
  return useNotificationStore((state) => state.getNotificationsByPlant(plantId));
};

export const useNotificationStats = () => {
  return useNotificationStore((state) => state.stats);
};

export const useNotificationPreferences = () => {
  return useNotificationStore((state) => state.preferences);
};

// Actions for external use
export const notificationActions = {
  addNotification: (notification: CreateNotificationInput) => useNotificationStore.getState().addNotification(notification),
  markAsRead: (id: string) => useNotificationStore.getState().markAsRead(id),
  markAllAsRead: () => useNotificationStore.getState().markAllAsRead(),
  setFilter: (filter: NotiType | 'all') => useNotificationStore.getState().setFilter(filter),
  addReminder: (reminder: ReminderConfig) => useNotificationStore.getState().addReminder(reminder),
  cleanupExpired: () => useNotificationStore.getState().cleanupExpired(),
  reset: () => useNotificationStore.getState().reset(),
};