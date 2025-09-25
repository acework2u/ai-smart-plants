import { z } from 'zod';
import { activityKindApiSchema, unitApiSchema } from '@modules/plants/plants.schemas';

const time24Schema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'ต้องอยู่ในรูปแบบ HH:MM');

const npkSchema = z.object({
  n: z.string().min(1),
  p: z.string().min(1),
  k: z.string().min(1)
});

const baseSchema = z.object({
  kind: activityKindApiSchema,
  quantity: z.string().min(1).optional(),
  unit: unitApiSchema.optional(),
  npk: npkSchema.optional(),
  note: z.string().max(500).optional(),
  dateISO: z.string().datetime().optional(),
  time24: time24Schema.optional()
});

const applyBusinessRules = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data: any, ctx) => {
    if (data.kind === 'ใส่ปุ๋ย' && !data.npk) {
      ctx.addIssue({
        path: ['npk'],
        code: z.ZodIssueCode.custom,
        message: 'ต้องระบุค่า NPK เมื่อกิจกรรมเป็นการใส่ปุ๋ย'
      });
    }

    if (data.npk && data.kind !== 'ใส่ปุ๋ย') {
      ctx.addIssue({
        path: ['npk'],
        code: z.ZodIssueCode.custom,
        message: 'อนุญาตให้ระบุ NPK เฉพาะเมื่อเป็นกิจกรรมใส่ปุ๋ย'
      });
    }

    if ((data.quantity && !data.unit) || (!data.quantity && data.unit)) {
      ctx.addIssue({
        path: ['unit'],
        code: z.ZodIssueCode.custom,
        message: 'ต้องระบุปริมาณและหน่วยคู่กัน'
      });
    }
  });

export const createActivitySchema = applyBusinessRules(
  baseSchema.extend({ id: z.string().optional() })
);

export const updateActivitySchema = applyBusinessRules(baseSchema.partial());

export const listActivitiesQuerySchema = z.object({
  kind: activityKindApiSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional()
});

export { time24Schema, npkSchema };
