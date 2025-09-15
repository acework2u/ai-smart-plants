import { z } from 'zod';
import { ActivityKind } from './activity';

// Notification types
export type NotiType = 'reminder' | 'ai' | 'alert' | 'achievement' | 'system';

// Notification priority levels
export type NotiPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification schema with comprehensive validation
export const NotiItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['reminder', 'ai', 'alert', 'achievement', 'system']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  title: z.string().min(1).max(200),
  detail: z.string().max(1000).optional(),
  timeLabel: z.string(),
  read: z.boolean().default(false),
  createdAt: z.date(),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  plantId: z.string().uuid().optional(),
  activityKind: z.enum(['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ']).optional(),
  actionUrl: z.string().optional(), // Deep link for action
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type NotiItem = z.infer<typeof NotiItemSchema>;

// Notification creation input
export type CreateNotificationInput = Omit<NotiItem, 'id' | 'createdAt'> & {
  read?: boolean; // Optional with default false
};

// Notification filter options
export interface NotificationFilter {
  types?: NotiType[];
  priorities?: NotiPriority[];
  read?: boolean;
  plantId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Notification preferences
export const NotificationPreferencesSchema = z.object({
  enabled: z.boolean().default(true),
  types: z.object({
    reminder: z.boolean().default(true),
    ai: z.boolean().default(true),
    alert: z.boolean().default(true),
    achievement: z.boolean().default(true),
    system: z.boolean().default(false),
  }),
  timing: z.object({
    quietHours: z.object({
      enabled: z.boolean().default(false),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM
    }),
    preferredTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  }),
  delivery: z.object({
    push: z.boolean().default(true),
    sound: z.boolean().default(true),
    vibration: z.boolean().default(true),
    badge: z.boolean().default(true),
  }),
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotiType, number>;
  byPriority: Record<NotiPriority, number>;
  todayCount: number;
  weekCount: number;
}

// Reminder scheduling configuration
export interface ReminderConfig {
  plantId: string;
  activityKind: ActivityKind;
  frequency: number; // days
  nextDue: Date;
  title: string;
  message: string;
  enabled: boolean;
  advanceNotice: number; // hours before due
  customTime?: string; // HH:MM format for custom scheduling
  weatherDependent?: boolean; // Skip if weather conditions don't require
  seasonalAdjustment?: boolean; // Adjust frequency based on season
}

// Per-plant notification preferences
export interface PlantNotificationPreferences {
  plantId: string;
  enabled: boolean;
  notifications: {
    watering: {
      enabled: boolean;
      frequency: number; // days
      customSchedule?: {
        times: string[]; // HH:MM format
        daysOfWeek: number[]; // 0-6
      };
      weatherAware: boolean;
      seasonalAdjust: boolean;
      advanceNotice: number; // hours
    };
    fertilizer: {
      enabled: boolean;
      frequency: number; // days (14, 21, 30 typical)
      customSchedule?: {
        times: string[];
        daysOfWeek: number[];
      };
      seasonalAdjust: boolean;
      advanceNotice: number;
    };
    healthCheck: {
      enabled: boolean;
      frequency: number; // days
      criticalAlerts: boolean;
      aiTips: boolean;
      photoReminders: boolean;
    };
    achievements: {
      enabled: boolean;
      streakMilestones: boolean;
      careMilestones: boolean;
      discoveryMilestones: boolean;
    };
  };
  dndSettings: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    allowCritical: boolean; // Allow critical alerts during DND
  };
  preferredTimes: {
    morning: string; // HH:MM (7-9am typical)
    evening: string; // HH:MM (5-7pm typical)
  };
  batchSimilar: boolean; // Group similar notifications
  maxPerDay: number; // Limit notifications per day per plant
}

// Global notification preferences (extending existing)
export interface GlobalNotificationPreferences extends NotificationPreferences {
  smartScheduling: {
    enabled: boolean;
    weatherIntegration: boolean;
    seasonalAdjustments: boolean;
    batchSimilarNotifications: boolean;
    priorityBasedDelivery: boolean;
  };
  globalDND: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string; // "06:00"
    allowUrgent: boolean;
    allowAchievements: boolean;
  };
  deliveryWindows: {
    morningStart: string; // "07:00"
    morningEnd: string; // "09:00"
    eveningStart: string; // "17:00"
    eveningEnd: string; // "19:00"
  };
  limits: {
    maxPerHour: number;
    maxPerDay: number;
    cooldownBetweenNotifications: number; // minutes
  };
}

// Achievement notification data
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'milestone' | 'care' | 'discovery';
  unlockedAt: Date;
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
}

// AI tip notification data
export interface AITipNotification {
  plantId?: string;
  tip: {
    title: string;
    description: string;
    category: 'watering' | 'fertilizing' | 'lighting' | 'general' | 'seasonal';
    urgency: 'info' | 'suggestion' | 'warning' | 'critical';
    actions?: Array<{
      label: string;
      action: string;
    }>;
  };
  context?: {
    weather?: string;
    season?: string;
    plantHealth?: string;
  };
}

// Smart notification template
export interface NotificationTemplate {
  id: string;
  type: NotiType;
  titleTemplate: string; // Can include {{plantName}}, {{activity}}, etc.
  messageTemplate: string;
  variables: string[]; // List of required variables
  conditions?: {
    plantStatus?: string[];
    timeOfDay?: string[];
    weather?: string[];
  };
}

// Notification delivery status
export interface NotificationDelivery {
  notificationId: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled' | 'skipped';
  attemptCount: number;
  lastAttempt?: Date;
  errorMessage?: string;
  deliveredAt?: Date;
  interactedAt?: Date;
  interaction?: 'opened' | 'dismissed' | 'action_taken';
  skipReason?: 'weather' | 'dnd' | 'limit_reached' | 'user_disabled';
}

// Scheduled notification entry
export interface ScheduledNotification {
  id: string;
  plantId?: string;
  type: NotiType;
  category: 'watering' | 'fertilizer' | 'health_check' | 'achievement' | 'ai_tip' | 'system';
  scheduledFor: Date;
  actualDelivery?: Date;
  title: string;
  message: string;
  priority: NotiPriority;
  isRecurring: boolean;
  recurringConfig?: {
    frequency: number; // days
    endDate?: Date;
    maxOccurrences?: number;
    currentOccurrence: number;
  };
  conditions?: {
    weatherDependent?: boolean;
    seasonAware?: boolean;
    timeWindow?: {
      start: string; // HH:MM
      end: string; // HH:MM
    };
  };
  metadata?: Record<string, unknown>;
  status: 'scheduled' | 'delivered' | 'cancelled' | 'failed' | 'skipped';
  delivery?: NotificationDelivery;
}

// Weather context for smart notifications
export interface WeatherContext {
  temperature: number;
  humidity: number;
  precipitation: number; // mm
  isRaining: boolean;
  conditions: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  uvIndex: number;
  windSpeed: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  lastUpdated: Date;
}

// Season-based care adjustments
export interface SeasonalCareConfig {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  adjustments: {
    wateringMultiplier: number; // 0.5 = half as often, 2.0 = twice as often
    fertilizerMultiplier: number;
    healthCheckFrequency: number; // days
    tips: string[];
  };
}

// Notification batch for grouping similar notifications
export interface NotificationBatch {
  id: string;
  type: 'care_reminders' | 'health_updates' | 'achievements' | 'tips';
  notifications: ScheduledNotification[];
  scheduledFor: Date;
  title: string;
  summary: string;
  plantCount: number;
  delivered: boolean;
  batchDelivery?: NotificationDelivery;
}

// Validation functions
export const validateNotification = (data: unknown): NotiItem => {
  const result = NotiItemSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid notification data: ${result.error.message}`);
  }
  return result.data;
};

export const validateNotificationPreferences = (data: unknown): NotificationPreferences => {
  const result = NotificationPreferencesSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid notification preferences: ${result.error.message}`);
  }
  return result.data;
};

// Helper functions
export const getNotificationIcon = (type: NotiType): string => {
  const icons: Record<NotiType, string> = {
    reminder: '⏰',
    ai: '🤖',
    alert: '⚠️',
    achievement: '🏆',
    system: '⚙️',
  };
  return icons[type] || '📢';
};

export const getNotificationColor = (priority: NotiPriority): string => {
  const colors: Record<NotiPriority, string> = {
    low: '#6b7280', // gray
    medium: '#3b82f6', // blue
    high: '#f59e0b', // amber
    urgent: '#ef4444', // red
  };
  return colors[priority] || '#6b7280';
};

export const isNotificationExpired = (notification: NotiItem): boolean => {
  if (!notification.expiresAt) return false;
  return new Date() > notification.expiresAt;
};

export const shouldShowNotification = (
  notification: NotiItem,
  preferences: NotificationPreferences
): boolean => {
  if (!preferences.enabled) return false;
  if (!preferences.types[notification.type]) return false;
  if (isNotificationExpired(notification)) return false;

  // Check quiet hours
  if (preferences.timing.quietHours.enabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = preferences.timing.quietHours;

    if (start <= end) {
      // Same day range
      if (currentTime >= start && currentTime <= end) return false;
    } else {
      // Overnight range
      if (currentTime >= start || currentTime <= end) return false;
    }
  }

  return true;
};

export const formatNotificationTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'เมื่อกี้นี้';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
};