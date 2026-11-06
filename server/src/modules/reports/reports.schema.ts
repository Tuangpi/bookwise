import { z } from 'zod';

export const reportDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const reportsRangeSchema = z.object({
  query: z.object({
    start: reportDateSchema.optional(),
    end: reportDateSchema.optional(),
  }),
});

export type ReportsRangeInput = z.infer<typeof reportsRangeSchema>['query'];
