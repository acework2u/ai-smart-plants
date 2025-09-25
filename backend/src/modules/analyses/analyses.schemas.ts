import { z } from 'zod';

import { plantStatusSchema } from '@modules/plants/plants.schemas';

export const startAnalysisSchema = z
  .object({
    plantId: z.string().optional(),
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().min(10).optional(),
    note: z.string().max(500).optional()
  })
  .superRefine((data, ctx) => {
    if (!data.imageUrl && !data.imageBase64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ต้องระบุ imageUrl หรือ imageBase64 อย่างน้อยหนึ่งค่า',
        path: ['imageUrl']
      });
    }
  });

export const listAnalysesQuerySchema = z.object({
  plantId: z.string().optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'expired']).optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional()
});

export const updateAnalysisPlantSchema = z.object({
  plantId: z.string(),
  status: plantStatusSchema.optional()
});

export type StartAnalysisInput = z.infer<typeof startAnalysisSchema>;
export type ListAnalysesQueryInput = z.infer<typeof listAnalysesQuerySchema>;
