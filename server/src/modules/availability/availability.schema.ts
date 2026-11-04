import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const availabilityQuerySchema = z.object({
  query: z.object({
    serviceId: z.string().min(1, 'serviceId is required'),
    date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
    staffId: z.string().optional(),
  }),
});
