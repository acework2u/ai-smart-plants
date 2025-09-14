import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  NotiItem,
  NotiType,
  CreateNotificationInput,
  NotificationFilter,
  NotificationStats,
  formatNotificationTime,
  validateNotification,
} from '../types/notifications';
import { ActivityKind } from '../types/activity';
import { STORAGE_KEYS } from '../types';

interface NotificationState {
  // State
  notifications: NotiItem[];
  filter: NotiType | 'all';
  lastRead: Date | null;

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

  // Scheduling Actions
  scheduleNotification: (notification: CreateNotificationInput & { scheduledFor: Date }) => Promise<string>;
  cancelScheduledNotification: (notificationId: string) => Promise<void>;

  // Bulk Actions
  markMultipleAsRead: (ids: string[]) => void;
  removeMultiple: (ids: string[]) => void;
}

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
Notifications.setNotificationHandler({
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
      filter: 'all',
      lastRead: null,

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
            await Notifications.cancelScheduledNotificationAsync(
              notification.metadata.scheduledIdentifier as string
            );
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
    }),
    {
      name: STORAGE_KEYS.NOTIFICATIONS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
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