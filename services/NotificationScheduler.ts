import type { NotificationTriggerInput } from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityKind } from '../types/activity';
import { Plant } from '../types/garden';
import { notificationsModule as Notifications } from './notifications/adapter';

// Configure notification behavior
Notifications?.setNotificationHandler?.({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  enabled: boolean;
  wateringReminder: {
    enabled: boolean;
    interval: 'daily' | 'every2days' | 'weekly' | 'custom';
    customDays?: number;
    time: string; // "07:00"
  };
  fertilizingReminder: {
    enabled: boolean;
    interval: 'weekly' | 'biweekly' | 'monthly';
    time: string;
  };
  healthCheckReminder: {
    enabled: boolean;
    interval: 'weekly' | 'monthly';
    time: string;
  };
  doNotDisturbMode: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "06:00"
  };
  weekendOnly: boolean;
  weatherAware: boolean;
}

export interface ScheduledNotification {
  id: string;
  plantId: string;
  type: ActivityKind | 'health_check' | 'achievement';
  triggerDate: Date;
  title: string;
  body: string;
  recurring: boolean;
  intervalDays?: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  wateringReminder: {
    enabled: true,
    interval: 'every2days',
    time: '07:00',
  },
  fertilizingReminder: {
    enabled: true,
    interval: 'biweekly',
    time: '08:00',
  },
  healthCheckReminder: {
    enabled: true,
    interval: 'weekly',
    time: '18:00',
  },
  doNotDisturbMode: {
    enabled: true,
    startTime: '22:00',
    endTime: '06:00',
  },
  weekendOnly: false,
  weatherAware: true,
};

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private storageKey = '@spa/notificationPrefs';

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Notifications?.getPermissionsAsync || !Notifications.requestPermissionsAsync) {
      console.warn('[notifications] Permissions APIs unavailable.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (
      Platform.OS === 'android' &&
      Notifications.setNotificationChannelAsync &&
      Notifications.AndroidImportance
    ) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Smart Plant Care',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16a34a',
        sound: 'default',
      });
    }

    return finalStatus === 'granted';
  }

  // Get notification preferences for a plant
  async getPreferences(plantId: string): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(`${this.storageKey}:${plantId}`);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  // Save notification preferences for a plant
  async savePreferences(plantId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPrefs = await this.getPreferences(plantId);
      const newPrefs = { ...currentPrefs, ...preferences };
      await AsyncStorage.setItem(`${this.storageKey}:${plantId}`, JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  // Schedule watering reminder for a plant
  async scheduleWateringReminder(plant: Plant): Promise<string | null> {
    const prefs = await this.getPreferences(plant.id);

    if (!prefs.enabled || !prefs.wateringReminder.enabled) {
      return null;
    }

    const trigger = this.calculateTriggerTime(
      prefs.wateringReminder.interval,
      prefs.wateringReminder.time,
      prefs.wateringReminder.customDays
    );

    if (!trigger) return null;

    if (!Notifications?.scheduleNotificationAsync) {
      console.warn('[notifications] scheduleNotificationAsync unavailable – skip watering reminder.');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 เวลารดน้ำ ${plant.name}`,
        body: `ถึงเวลารดน้ำให้ ${plant.name} แล้ว อย่าลืมตรวจสอบความชื้นของดินด้วยนะ`,
        data: {
          plantId: plant.id,
          type: 'รดน้ำ',
          action: 'water_reminder',
        },
        sound: 'default',
      },
      trigger,
    });

    return notificationId;
  }

  // Schedule fertilizer reminder
  async scheduleFertilizerReminder(plant: Plant): Promise<string | null> {
    const prefs = await this.getPreferences(plant.id);

    if (!prefs.enabled || !prefs.fertilizingReminder.enabled) {
      return null;
    }

    const trigger = this.calculateTriggerTime(
      prefs.fertilizingReminder.interval,
      prefs.fertilizingReminder.time
    );

    if (!trigger) return null;

    if (!Notifications?.scheduleNotificationAsync) {
      console.warn('[notifications] scheduleNotificationAsync unavailable – skip fertilizer reminder.');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌿 เวลาใส่ปุ๋ย ${plant.name}`,
        body: `ถึงเวลาให้ปุ๋ย ${plant.name} แล้ว ช่วยให้ต้นไม้เติบโตแข็งแรง`,
        data: {
          plantId: plant.id,
          type: 'ใส่ปุ๋ย',
          action: 'fertilizer_reminder',
        },
        sound: 'default',
      },
      trigger,
    });

    return notificationId;
  }

  // Schedule health check reminder
  async scheduleHealthCheckReminder(plant: Plant): Promise<string | null> {
    const prefs = await this.getPreferences(plant.id);

    if (!prefs.enabled || !prefs.healthCheckReminder.enabled) {
      return null;
    }

    const trigger = this.calculateTriggerTime(
      prefs.healthCheckReminder.interval,
      prefs.healthCheckReminder.time
    );

    if (!trigger) return null;

    if (!Notifications?.scheduleNotificationAsync) {
      console.warn('[notifications] scheduleNotificationAsync unavailable – skip health check reminder.');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔍 ตรวจสุขภาพ ${plant.name}`,
        body: `มาตรวจดูสุขภาพของ ${plant.name} กันเถอะ ดูใบ ลำต้น และรากว่าปกติดีไหม`,
        data: {
          plantId: plant.id,
          type: 'ตรวจใบ',
          action: 'health_check_reminder',
        },
        sound: 'default',
      },
      trigger,
    });

    return notificationId;
  }

  // Schedule achievement notification
  async scheduleAchievementNotification(title: string, body: string, plantId?: string): Promise<string | null> {
    if (!Notifications?.scheduleNotificationAsync) {
      console.warn('[notifications] scheduleNotificationAsync unavailable – skip achievement notification.');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 ${title}`,
        body,
        data: {
          plantId,
          type: 'achievement',
          action: 'achievement_unlock',
        },
        sound: 'default',
      },
      trigger: null, // Immediate notification
    });

    return notificationId;
  }

  // Cancel all notifications for a plant
  async cancelPlantNotifications(plantId: string): Promise<void> {
    if (!Notifications?.getAllScheduledNotificationsAsync) {
      console.warn('[notifications] getAllScheduledNotificationsAsync unavailable – nothing to cancel.');
      return;
    }

    const allNotifications = Notifications?.getAllScheduledNotificationsAsync
      ? await Notifications.getAllScheduledNotificationsAsync()
      : [];

    if (!Notifications?.cancelScheduledNotificationAsync) {
      console.warn('[notifications] cancelScheduledNotificationAsync unavailable – cannot cancel plant notifications.');
      return;
    }
    const plantNotifications = allNotifications.filter(
      notif => notif.content.data?.plantId === plantId
    );

    for (const notification of plantNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    if (!Notifications?.cancelScheduledNotificationAsync) {
      console.warn('[notifications] cancelScheduledNotificationAsync unavailable.');
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Get all scheduled notifications for a plant
  async getPlantNotifications(plantId: string): Promise<ScheduledNotification[]> {
    if (!Notifications?.getAllScheduledNotificationsAsync) {
      return [];
    }

    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return allNotifications
      .filter(notif => notif.content.data?.plantId === plantId)
      .map(notif => ({
        id: notif.identifier,
        plantId,
        type: notif.content.data?.type || 'รดน้ำ',
        triggerDate: notif.trigger && 'date' in notif.trigger ? new Date(notif.trigger.date as number) : new Date(),
        title: notif.content.title || '',
        body: notif.content.body || '',
        recurring: notif.trigger ? 'repeats' in notif.trigger && Boolean(notif.trigger.repeats) : false,
      }));
  }

  // Reschedule all notifications for a plant
  async rescheduleAllNotifications(plant: Plant): Promise<void> {
    await this.cancelPlantNotifications(plant.id);

    await Promise.all([
      this.scheduleWateringReminder(plant),
      this.scheduleFertilizerReminder(plant),
      this.scheduleHealthCheckReminder(plant),
    ]);
  }

  // Private helper methods
  private calculateTriggerTime(
    interval: string,
    time: string,
    customDays?: number
  ): NotificationTriggerInput | null {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const triggerDate = new Date();

    triggerDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: NotificationTriggerInput = {
      type: 'date',
      date: triggerDate,
      repeats: true,
    };

    return trigger;
  }

  // Check if current time is in Do Not Disturb period
  private isInDoNotDisturbPeriod(prefs: NotificationPreferences): boolean {
    if (!prefs.doNotDisturbMode.enabled) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = prefs.doNotDisturbMode.startTime.split(':').map(Number);
    const [endHour, endMinute] = prefs.doNotDisturbMode.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Spans midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Initialize notifications for all plants
  async initializeNotifications(plants: Plant[]): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return;
    }

    // Cancel all existing notifications
    if (Notifications?.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // Schedule notifications for each plant
    for (const plant of plants) {
      await this.rescheduleAllNotifications(plant);
    }
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();
