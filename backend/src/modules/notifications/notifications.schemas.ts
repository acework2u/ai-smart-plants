import { z } from 'zod';

export const notificationTypeSchema = z.enum(['reminder', 'ai', 'alert', 'achievement', 'system']);

export const listNotificationsQuerySchema = z.object({
  type: notificationTypeSchema.optional(),
  unread: z.coerce.boolean().optional(),
  updatedSince: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional()
});

export const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

export const subscribeSchema = z.object({
  deviceId: z.string().min(3),
  pushToken: z.string().min(10),
  platform: z.enum(['expo', 'apns', 'fcm']).optional(),
  locale: z.string().optional()
});

export type ListNotificationsQueryInput = z.infer<typeof listNotificationsQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
