import { z } from 'zod';

export const summaryQuerySchema = z.object({
  plantId: z.string().optional()
});

export const trendsQuerySchema = z.object({
  metric: z.enum(['wateringConsistency', 'fertilizerBalance', 'plantHealthIndex']),
  window: z.enum(['7d', '30d', '90d']),
  compareTo: z.enum(['previous']).optional(),
  plantId: z.string().optional()
});

export type SummaryQueryInput = z.infer<typeof summaryQuerySchema>;
export type TrendsQueryInput = z.infer<typeof trendsQuerySchema>;
