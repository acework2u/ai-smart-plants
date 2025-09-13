import { z } from 'zod';

// Activity types in Thai
export type ActivityKind = 'รดน้ำ' | 'ใส่ปุ๋ย' | 'พ่นยา' | 'ย้ายกระถาง' | 'ตรวจใบ';

// Units for measurements (including Thai units)
export type Unit = 'ml' | 'g' | 'pcs' | 'ล.'; // ล. = ลิตร (liters)

// NPK fertilizer values
export const NPKSchema = z.object({
  n: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  p: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  k: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
});

export type NPK = z.infer<typeof NPKSchema>;

// Activity entry schema with comprehensive validation
export const ActivityEntrySchema = z.object({
  id: z.string().uuid(),
  plantId: z.string().uuid(),
  kind: z.enum(['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ']),
  quantity: z.string().regex(/^\d*\.?\d+$/).optional(),
  unit: z.enum(['ml', 'g', 'pcs', 'ล.']).optional(),
  npk: NPKSchema.optional(),
  note: z.string().max(500).optional(),
  dateISO: z.string().datetime(),
  time24: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM format
  createdAt: z.date(),
  confidence: z.number().min(0).max(1).optional(), // For AI-generated entries
  source: z.enum(['user', 'ai', 'scheduled']).default('user'),
});

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;

// Activity creation input
export type CreateActivityInput = Omit<ActivityEntry, 'id' | 'createdAt'>;

// Activity update input
export type UpdateActivityInput = Partial<Omit<ActivityEntry, 'id' | 'plantId' | 'createdAt'>>;

// Activity filter options
export interface ActivityFilter {
  kinds?: ActivityKind[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasQuantity?: boolean;
  source?: ActivityEntry['source'];
}

// Activity statistics
export interface ActivityStats {
  totalActivities: number;
  byKind: Record<ActivityKind, number>;
  byMonth: Record<string, number>; // YYYY-MM format
  averageFrequency: Record<ActivityKind, number>; // days between activities
  lastActivity?: ActivityEntry;
}

// Per-plant activity preferences (persisted)
export const PlantPrefsSchema = z.object({
  lastKind: z.enum(['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ']).optional(),
  lastUnit: z.enum(['ml', 'g', 'pcs', 'ล.']).optional(),
  lastQty: z.string().optional(),
  lastNPK: NPKSchema.optional(),
  preferredWateringUnit: z.enum(['ml', 'ล.']).optional(),
  preferredFertilizerUnit: z.enum(['g', 'ml']).optional(),
  reminderSettings: z.object({
    wateringInterval: z.number().min(1).max(30).optional(), // days
    fertilizingInterval: z.number().min(1).max(90).optional(), // days
    enableReminders: z.boolean().default(true),
  }).optional(),
});

export type PlantPrefs = z.infer<typeof PlantPrefsSchema>;

// Activity suggestion based on plant and history
export interface ActivitySuggestion {
  id: string;
  plantId: string;
  kind: ActivityKind;
  suggestedQuantity?: string;
  suggestedUnit?: Unit;
  suggestedNPK?: NPK;
  reason: string; // Why this activity is suggested
  urgency: 'low' | 'medium' | 'high';
  dueDate?: Date;
  confidence: number; // 0-1 AI confidence
}

// Activity template for quick logging
export interface ActivityTemplate {
  id: string;
  name: string;
  kind: ActivityKind;
  defaultQuantity?: string;
  defaultUnit?: Unit;
  defaultNPK?: NPK;
  instructions?: string[];
  isCustom: boolean; // User-created vs system template
}

// Validation functions
export const validateActivityEntry = (data: unknown): ActivityEntry => {
  const result = ActivityEntrySchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid activity data: ${result.error.message}`);
  }
  return result.data;
};

export const validateNPK = (data: unknown): NPK => {
  const result = NPKSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid NPK data: ${result.error.message}`);
  }
  return result.data;
};

export const validatePlantPrefs = (data: unknown): PlantPrefs => {
  const result = PlantPrefsSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid plant preferences: ${result.error.message}`);
  }
  return result.data;
};

// Helper functions
export const isValidQuantity = (quantity: string): boolean => {
  return /^\d*\.?\d+$/.test(quantity) && parseFloat(quantity) > 0;
};

export const formatQuantityWithUnit = (quantity?: string, unit?: Unit): string => {
  if (!quantity) return '';
  return `${quantity}${unit || ''}`;
};

export const getActivityIcon = (kind: ActivityKind): string => {
  const icons: Record<ActivityKind, string> = {
    'รดน้ำ': '💧',
    'ใส่ปุ๋ย': '🌱',
    'พ่นยา': '🧴',
    'ย้ายกระถาง': '🪴',
    'ตรวจใบ': '🔍',
  };
  return icons[kind] || '📝';
};

export const getActivityColor = (kind: ActivityKind): string => {
  const colors: Record<ActivityKind, string> = {
    'รดน้ำ': '#3b82f6', // blue
    'ใส่ปุ๋ย': '#10b981', // green
    'พ่นยา': '#f59e0b', // amber
    'ย้ายกระถาง': '#8b5cf6', // purple
    'ตรวจใบ': '#6b7280', // gray
  };
  return colors[kind] || '#6b7280';
};