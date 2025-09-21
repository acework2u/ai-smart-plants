import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotiItem,
  NotiType,
  CreateNotificationInput,
  NotificationStats,
  formatNotificationTime,
  validateNotification,
  ScheduledNotification,
  PlantNotificationPreferences,
  GlobalNotificationPreferences,
  WeatherContext,
  SeasonalCareConfig,
} from '../types/notifications';
import { ActivityKind } from '../types/activity';
import { STORAGE_KEYS } from '../types';
import { NotificationScheduler } from '../services/NotificationScheduler';
import { Plant } from '../types/garden';
import { notificationsModule as Notifications } from '../services/notifications/adapter';

interface NotificationState {
  // State
  notifications: NotiItem[];
  scheduledNotifications: ScheduledNotification[];
  plantPreferences: Record<string, PlantNotificationPreferences>;
  globalPreferences: GlobalNotificationPreferences;
  weatherContext?: WeatherContext;
  filter: NotiType | 'all';
  lastRead: Date | null;
  scheduler?: NotificationScheduler;

  // Actions
  addNotification: (notification: CreateNotificationInput) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updateNotification: (id: string, updates: Partial<NotiItem>) => void;
  clearNotifications: () => void;
  clearOldNotifications: (olderThan: Date) => void;

  // Filter Actions
  setFilter: (filter: NotiType | 'all') => void;
  getFilteredNotifications: () => NotiItem[];

  // Query Actions
  getNotificationStats: () => NotificationStats;
  getUnreadCount: () => number;
  getNotificationsByType: (type: NotiType) => NotiItem[];
  getNotificationsByPlant: (plantId: string) => NotiItem[];

  // Enhanced Scheduling Actions
  scheduleNotification: (notification: CreateNotificationInput & { scheduledFor: Date }) => Promise<string>;
  cancelScheduledNotification: (notificationId: string) => Promise<void>;
  scheduleWateringReminder: (plant: Plant) => Promise<string>;
  scheduleFertilizerReminder: (plant: Plant) => Promise<string>;
  scheduleHealthCheckReminder: (plant: Plant) => Promise<string>;
  scheduleAchievementNotification: (achievement: any) => Promise<string>;
  scheduleAITipNotification: (tip: any) => Promise<string>;

  // Preferences Management
  updateGlobalPreferences: (preferences: Partial<GlobalNotificationPreferences>) => Promise<void>;
  updatePlantPreferences: (plantId: string, preferences: PlantNotificationPreferences) => Promise<void>;
  getPlantPreferences: (plantId: string) => PlantNotificationPreferences;
  initializeDefaultPlantPreferences: (plantId: string, plantName: string) => PlantNotificationPreferences;

  // Weather Integration
  updateWeatherContext: (weather: WeatherContext) => Promise<void>;

  // Scheduler Management
  initializeScheduler: () => Promise<void>;
  getScheduledNotifications: () => ScheduledNotification[];
  getNotificationHistory: (limit?: number) => ScheduledNotification[];
  cancelAllNotificationsForPlant: (plantId: string) => Promise<void>;

  // Bulk Actions
  markMultipleAsRead: (ids: string[]) => void;
  removeMultiple: (ids: string[]) => void;
}

// Default global notification preferences
const createDefaultGlobalPreferences = (): GlobalNotificationPreferences => ({
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
      enabled: true,
      start: '22:00',
      end: '06:00',
    },
    preferredTime: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  delivery: {
    push: true,
    sound: true,
    vibration: true,
    badge: true,
  },
  smartScheduling: {
    enabled: true,
    weatherIntegration: true,
    seasonalAdjustments: true,
    batchSimilarNotifications: true,
    priorityBasedDelivery: true,
  },
  globalDND: {
    enabled: true,
    startTime: '22:00',
    endTime: '06:00',
    allowUrgent: true,
    allowAchievements: false,
  },
  deliveryWindows: {
    morningStart: '07:00',
    morningEnd: '09:00',
    eveningStart: '17:00',
    eveningEnd: '19:00',
  },
  limits: {
    maxPerHour: 5,
    maxPerDay: 20,
    cooldownBetweenNotifications: 5,
  },
});

// Default seasonal care configurations
const createDefaultSeasonalConfigs = (): Record<string, SeasonalCareConfig> => ({
  spring: {
    season: 'spring',
    adjustments: {
      wateringMultiplier: 1.2,
      fertilizerMultiplier: 0.8,
      healthCheckFrequency: 3,
      tips: ['ฤดูใบไม้ผลิเป็นช่วงที่พืชเติบโตเร็ว', 'เพิ่มการรดน้ำเล็กน้อย'],
    },
  },
  summer: {
    season: 'summer',
    adjustments: {
      wateringMultiplier: 1.5,
      fertilizerMultiplier: 1.2,
      healthCheckFrequency: 2,
      tips: ['ฤดูร้อนต้องดูแลความชื้นให้มาก', 'หลีกเลี่ยงแสงแดดจัดในช่วงเที่ยง'],
    },
  },
  autumn: {
    season: 'autumn',
    adjustments: {
      wateringMultiplier: 0.8,
      fertilizerMultiplier: 0.6,
      healthCheckFrequency: 4,
      tips: ['ฤดูใบไม้ร่วงลดการรดน้ำลง', 'เตรียมพืชสำหรับฤดูหนาว'],
    },
  },
  winter: {
    season: 'winter',
    adjustments: {
      wateringMultiplier: 0.6,
      fertilizerMultiplier: 0.4,
      healthCheckFrequency: 5,
      tips: ['ฤดูหนาวพืชต้องการน้ำน้อย', 'ระวังโรคราเนื่องจากความชื้นสูง'],
    },
  },
});

// Mock notification data for development
const createMockNotifications = (): NotiItem[] => [
  {
    id: 'noti-1',
    type: 'reminder',
    priority: 'medium',
    title: 'เวลารดน้ำต้น Monstera Deliciosa',
    detail: 'ถึงเวลารดน้ำต้นมอนสเตอร่าของคุณแล้ว ตรวจสอบความชื้นของดินก่อนรดน้ำ',
    timeLabel: '15 นาทีที่แล้ว',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    plantId: 'plant-1',
    activityKind: 'รดน้ำ',
  },
  {
    id: 'noti-2',
    type: 'ai',
    priority: 'high',
    title: 'คำแนะนำจาก AI: ใบไม้เริ่มเหลือง',
    detail: 'ตรวจพบใบไม้เริ่มเหลืองในต้น Fiddle Leaf Fig อาจเป็นเพราะรดน้ำมากเกินไป ลองลดปริมาณการรดน้ำ',
    timeLabel: '1 ชั่วโมงที่แล้ว',
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    plantId: 'plant-2',
    metadata: {
      confidence: 0.85,
      issueDetected: 'yellow_leaves',
    },
  },
  {
    id: 'noti-3',
    type: 'achievement',
    priority: 'medium',
    title: 'ปลดล็อกความสำเร็จใหม่!',
    detail: 'คุณดูแลต้นไม้ครบ 7 วันติดต่อกัน เยี่ยมมาก! 🌱',
    timeLabel: '3 ชั่วโมงที่แล้ว',
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    metadata: {
      achievementType: 'streak',
      streakDays: 7,
    },
  },
  {
    id: 'noti-4',
    type: 'alert',
    priority: 'urgent',
    title: 'ระดับความชื้นต่ำมาก!',
    detail: 'ต้น Snake Plant ของคุณต้องการน้ำเร่งด่วน ดินแห้งมาก 3 วันแล้ว',
    timeLabel: '5 ชั่วโมงที่แล้ว',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    plantId: 'plant-3',
    activityKind: 'รดน้ำ',
  },
  {
    id: 'noti-5',
    type: 'system',
    priority: 'low',
    title: 'อัปเดตแอป Smart Plant AI',
    detail: 'มีฟีเจอร์ใหม่ที่น่าสนใจ! ระบบ AI ที่ชาญฉลาดขึ้น และการวิเคราะห์สุขภาพพืชที่แม่นยำมากขึ้น',
    timeLabel: '1 วันที่แล้ว',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    metadata: {
      version: '1.2.0',
      features: ['improved_ai', 'better_analysis', 'new_ui'],
    },
  },
];

// Configure notification handling
Notifications?.setNotificationHandler?.({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: createMockNotifications(),
      scheduledNotifications: [],
      plantPreferences: {},
      globalPreferences: createDefaultGlobalPreferences(),
      weatherContext: undefined,
      filter: 'all',
      lastRead: null,
      scheduler: undefined,

      // Actions
      addNotification: (notificationInput: CreateNotificationInput) => {
        try {
          const notification: NotiItem = {
            ...notificationInput,
            id: `noti-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            timeLabel: 'เมื่อกี้นี้',
          };

          // Validate notification
          validateNotification(notification);

          set(
            produce((state) => {
              state.notifications.unshift(notification);

              // Keep only the latest 100 notifications
              if (state.notifications.length > 100) {
                state.notifications = state.notifications.slice(0, 100);
              }
            })
          );
        } catch (error) {
          console.error('Failed to add notification:', error);
        }
      },

      removeNotification: (id: string) => {
        set(
          produce((state) => {
            const index = state.notifications.findIndex((n: NotiItem) => n.id === id);
            if (index !== -1) {
              state.notifications.splice(index, 1);
            }
          })
        );
      },

      markAsRead: (id: string) => {
        set(
          produce((state) => {
            const notification = state.notifications.find((n: NotiItem) => n.id === id);
            if (notification) {
              notification.read = true;
            }
          })
        );
      },

      markAllAsRead: () => {
        set(
          produce((state) => {
            state.notifications.forEach((notification: NotiItem) => {
              notification.read = true;
            });
            state.lastRead = new Date();
          })
        );
      },

      updateNotification: (id: string, updates: Partial<NotiItem>) => {
        set(
          produce((state) => {
            const notification = state.notifications.find((n: NotiItem) => n.id === id);
            if (notification) {
              Object.assign(notification, updates);
            }
          })
        );
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      clearOldNotifications: (olderThan: Date) => {
        set(
          produce((state) => {
            state.notifications = state.notifications.filter(
              (n: NotiItem) => n.createdAt > olderThan
            );
          })
        );
      },

      // Filter Actions
      setFilter: (filter: NotiType | 'all') => {
        set({ filter });
      },

      getFilteredNotifications: () => {
        const { notifications, filter } = get();
        if (filter === 'all') {
          return notifications;
        }
        return notifications.filter((n) => n.type === filter);
      },

      // Query Actions
      getNotificationStats: (): NotificationStats => {
        const notifications = get().notifications;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats: NotificationStats = {
          total: notifications.length,
          unread: notifications.filter((n) => !n.read).length,
          byType: {
            reminder: 0,
            ai: 0,
            alert: 0,
            achievement: 0,
            system: 0,
          },
          byPriority: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0,
          },
          todayCount: notifications.filter((n) => n.createdAt >= todayStart).length,
          weekCount: notifications.filter((n) => n.createdAt >= weekStart).length,
        };

        notifications.forEach((notification) => {
          stats.byType[notification.type]++;
          stats.byPriority[notification.priority]++;
        });

        return stats;
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      getNotificationsByType: (type: NotiType) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getNotificationsByPlant: (plantId: string) => {
        return get().notifications.filter((n) => n.plantId === plantId);
      },

      // Scheduling Actions
      scheduleNotification: async (notification: CreateNotificationInput & { scheduledFor: Date }) => {
        try {
          if (!Notifications?.scheduleNotificationAsync) {
            console.warn('[notifications] scheduleNotificationAsync unavailable – scheduling skipped.');
            return 'notifications-disabled';
          }

          const { scheduledFor, ...notificationData } = notification;

          // Schedule with Expo Notifications
          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.detail || '',
              data: {
                notificationId: `scheduled-${Date.now()}`,
                type: notification.type,
                plantId: notification.plantId,
              },
            },
            trigger: {
              type: 'date' as any,
              date: scheduledFor,
            },
          });

          // Add to store
          get().addNotification({
            ...notificationData,
            scheduledFor,
            metadata: {
              ...notificationData.metadata,
              scheduledIdentifier: identifier,
            },
          });

          return identifier;
        } catch (error) {
          console.error('Failed to schedule notification:', error);
          throw error;
        }
      },

      cancelScheduledNotification: async (notificationId: string) => {
        try {
          const notification = get().notifications.find((n) => n.id === notificationId);
          if (notification?.metadata?.scheduledIdentifier) {
            if (!Notifications?.cancelScheduledNotificationAsync) {
              console.warn('[notifications] cancelScheduledNotificationAsync unavailable – skip cancel.');
            } else {
              await Notifications.cancelScheduledNotificationAsync(
                notification.metadata.scheduledIdentifier as string
              );
            }
          }

          get().removeNotification(notificationId);
        } catch (error) {
          console.error('Failed to cancel scheduled notification:', error);
          throw error;
        }
      },

      // Bulk Actions
      markMultipleAsRead: (ids: string[]) => {
        set(
          produce((state) => {
            ids.forEach((id) => {
              const notification = state.notifications.find((n: NotiItem) => n.id === id);
              if (notification) {
                notification.read = true;
              }
            });
          })
        );
      },

      removeMultiple: (ids: string[]) => {
        set(
          produce((state) => {
            state.notifications = state.notifications.filter(
              (n: NotiItem) => !ids.includes(n.id)
            );
          })
        );
      },

      // Enhanced Scheduling Actions
      scheduleWateringReminder: async (plant: Plant) => {
        const state = get();
        if (!state.scheduler) {
          await get().initializeScheduler();
        }

        const preferences = get().getPlantPreferences(plant.id);
        return state.scheduler!.scheduleWateringReminder(plant, preferences);
      },

      scheduleFertilizerReminder: async (plant: Plant) => {
        const state = get();
        if (!state.scheduler) {
          await get().initializeScheduler();
        }

        const preferences = get().getPlantPreferences(plant.id);
        return state.scheduler!.scheduleFertilizerReminder(plant, preferences);
      },

      scheduleHealthCheckReminder: async (plant: Plant) => {
        const state = get();
        if (!state.scheduler) {
          await get().initializeScheduler();
        }

        const preferences = get().getPlantPreferences(plant.id);
        return state.scheduler!.scheduleHealthCheckReminder(plant, preferences);
      },

      scheduleAchievementNotification: async (achievement: any) => {
        const state = get();
        if (!state.scheduler) {
          await get().initializeScheduler();
        }

        return state.scheduler!.scheduleAchievementNotification(achievement);
      },

      scheduleAITipNotification: async (tip: any) => {
        const state = get();
        if (!state.scheduler) {
          await get().initializeScheduler();
        }

        return state.scheduler!.scheduleAITipNotification(tip);
      },

      // Preferences Management
      updateGlobalPreferences: async (preferences: Partial<GlobalNotificationPreferences>) => {
        set(
          produce((state) => {
            state.globalPreferences = { ...state.globalPreferences, ...preferences };
          })
        );

        const state = get();
        if (state.scheduler) {
          await state.scheduler.updateGlobalPreferences(state.globalPreferences);
        }
      },

      updatePlantPreferences: async (plantId: string, preferences: PlantNotificationPreferences) => {
        set(
          produce((state) => {
            state.plantPreferences[plantId] = preferences;
          })
        );

        const state = get();
        if (state.scheduler) {
          await state.scheduler.updatePlantPreferences(plantId, preferences);
        }

        // Store in AsyncStorage for persistence
        try {
          await AsyncStorage.setItem(
            `${STORAGE_KEYS.PLANT_PREFS_PREFIX}${plantId}`,
            JSON.stringify(preferences)
          );
        } catch (error) {
          console.error('Failed to save plant preferences:', error);
        }
      },

      getPlantPreferences: (plantId: string) => {
        const state = get();
        return state.plantPreferences[plantId] || get().initializeDefaultPlantPreferences(plantId, 'ต้นไม้');
      },

      initializeDefaultPlantPreferences: (plantId: string, plantName: string) => {
        const defaultPrefs: PlantNotificationPreferences = {
          plantId,
          enabled: true,
          notifications: {
            watering: {
              enabled: true,
              frequency: 3, // every 3 days
              weatherAware: true,
              seasonalAdjust: true,
              advanceNotice: 1, // 1 hour
            },
            fertilizer: {
              enabled: true,
              frequency: 14, // every 2 weeks
              seasonalAdjust: true,
              advanceNotice: 24, // 1 day
            },
            healthCheck: {
              enabled: true,
              frequency: 7, // weekly
              criticalAlerts: true,
              aiTips: true,
              photoReminders: true,
            },
            achievements: {
              enabled: true,
              streakMilestones: true,
              careMilestones: true,
              discoveryMilestones: true,
            },
          },
          dndSettings: {
            enabled: false,
            startTime: '22:00',
            endTime: '06:00',
            allowCritical: true,
          },
          preferredTimes: {
            morning: '08:00',
            evening: '18:00',
          },
          batchSimilar: true,
          maxPerDay: 5,
        };

        set(
          produce((state) => {
            state.plantPreferences[plantId] = defaultPrefs;
          })
        );

        return defaultPrefs;
      },

      // Weather Integration
      updateWeatherContext: async (weather: WeatherContext) => {
        set(
          produce((state) => {
            state.weatherContext = weather;
          })
        );

        const state = get();
        if (state.scheduler) {
          await state.scheduler.updateWeatherContext(weather);
        }
      },

      // Scheduler Management
      initializeScheduler: async () => {
        const state = get();

        if (state.scheduler) {
          return; // Already initialized
        }

        try {
          const scheduler = new NotificationScheduler({
            globalPreferences: state.globalPreferences,
            plantPreferences: state.plantPreferences,
            weatherContext: state.weatherContext,
            seasonalConfigs: createDefaultSeasonalConfigs(),
          });

          set(
            produce((state) => {
              state.scheduler = scheduler;
            })
          );

          console.log('Notification scheduler initialized');
        } catch (error) {
          console.error('Failed to initialize scheduler:', error);
        }
      },

      getScheduledNotifications: () => {
        const state = get();
        return state.scheduler?.getScheduledNotifications() || [];
      },

      getNotificationHistory: (limit = 50) => {
        const state = get();
        return state.scheduler?.getNotificationHistory(limit) || [];
      },

      cancelAllNotificationsForPlant: async (plantId: string) => {
        const state = get();
        if (state.scheduler) {
          await state.scheduler.cancelAllNotificationsForPlant(plantId);
        }
      },
    }),
    {
      name: STORAGE_KEYS.NOTIFICATIONS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        scheduledNotifications: state.scheduledNotifications,
        plantPreferences: state.plantPreferences,
        globalPreferences: state.globalPreferences,
        weatherContext: state.weatherContext,
        filter: state.filter,
        lastRead: state.lastRead,
      }),
    }
  )
);

// Helper functions for notification management
export const NotificationHelpers = {
  // Create common notification types
  createReminderNotification: (
    plantName: string,
    activityKind: ActivityKind,
    plantId?: string
  ): CreateNotificationInput => ({
    type: 'reminder',
    priority: 'medium',
    title: `เวลา${activityKind}ต้น ${plantName}`,
    detail: `ถึงเวลา${activityKind}ต้น${plantName}แล้ว อย่าลืมดูแลต้นไม้ของคุณนะ`,
    timeLabel: formatNotificationTime(new Date()),
    read: false,
    plantId,
    activityKind: activityKind,
  }),

  createAITipNotification: (
    tip: string,
    plantName?: string,
    plantId?: string
  ): CreateNotificationInput => ({
    type: 'ai',
    priority: 'high',
    title: 'คำแนะนำจาก AI',
    detail: tip,
    timeLabel: formatNotificationTime(new Date()),
    read: false,
    plantId,
  }),

  createAchievementNotification: (
    title: string,
    description: string
  ): CreateNotificationInput => ({
    type: 'achievement',
    priority: 'medium',
    title,
    detail: description,
    timeLabel: formatNotificationTime(new Date()),
    read: false,
  }),

  createAlertNotification: (
    title: string,
    message: string,
    plantId?: string
  ): CreateNotificationInput => ({
    type: 'alert',
    priority: 'urgent',
    title,
    detail: message,
    timeLabel: formatNotificationTime(new Date()),
    read: false,
    plantId,
  }),

  // Update notification time labels (call periodically)
  updateTimeLabels: (notifications: NotiItem[]): NotiItem[] => {
    return notifications.map((notification) => ({
      ...notification,
      timeLabel: formatNotificationTime(notification.createdAt),
    }));
  },

  // Filter expired notifications
  filterExpired: (notifications: NotiItem[]): NotiItem[] => {
    return notifications.filter(
      (n) => !n.expiresAt || new Date() <= n.expiresAt
    );
  },
};

export default useNotificationStore;
