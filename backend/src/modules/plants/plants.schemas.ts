import { z } from 'zod';

export const plantStatusSchema = z.enum(['healthy', 'warning', 'critical', 'archived']);
export const activityKindApiSchema = z.enum(['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ']);
export const unitApiSchema = z.enum(['ml', 'g', 'pcs', 'ล.']);

export const plantLocationSchema = z
  .object({
    room: z.string().optional(),
    lightLevel: z.string().optional()
  })
  .optional();

export const createPlantSchema = z.object({
  id: z.string().optional(),
  nickname: z.string().min(1),
  scientificName: z.string().optional(),
  status: plantStatusSchema.optional(),
  imageRef: z.string().url().optional(),
  location: plantLocationSchema,
  statusColor: z.string().optional(),
  acquiredAt: z.string().optional(),
  userId: z.string().min(1),
  preferences: z
    .object({
      lastKind: activityKindApiSchema.optional(),
      lastUnit: unitApiSchema.optional(),
      lastQty: z.string().optional(),
      lastN: z.string().optional(),
      lastP: z.string().optional(),
      lastK: z.string().optional(),
      reminderWater: z.number().int().min(0).optional(),
      reminderFertil: z.number().int().min(0).optional(),
      enableReminders: z.boolean().optional()
    })
    .optional()
});

export const updatePlantSchema = createPlantSchema.partial().extend({
  userId: z.string().optional()
});

export const getPlantsQuerySchema = z.object({
  status: plantStatusSchema.optional(),
  q: z.string().optional(),
  updatedSince: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional()
});

export const upsertPreferenceSchema = z.object({
  lastKind: activityKindApiSchema.optional(),
  lastUnit: unitApiSchema.optional(),
  lastQty: z.string().optional(),
  lastN: z.string().optional(),
  lastP: z.string().optional(),
  lastK: z.string().optional(),
  reminderWater: z.number().int().min(0).optional(),
  reminderFertil: z.number().int().min(0).optional(),
  enableReminders: z.boolean().optional()
});
