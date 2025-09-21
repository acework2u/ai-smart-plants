import type { GlobalNotificationPreferences } from '../../types/notifications';

export const createDefaultNotificationOverrides = (): Partial<GlobalNotificationPreferences> => ({
  enabled: true,
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
  timing: {
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '06:00',
    },
    preferredTime: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
});

