import { z } from 'zod';

export const updateBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    logoUrl: z.string().url().optional(),
  }),
});
