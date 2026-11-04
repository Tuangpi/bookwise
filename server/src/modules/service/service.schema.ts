import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    durationMin: z.number().int().min(5).max(480),
    price: z.number().min(0),
    categoryId: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    durationMin: z.number().int().min(5).max(480).optional(),
    price: z.number().min(0).optional(),
    categoryId: z.string().nullable().optional(),
    active: z.boolean().optional(),
  }),
  params: z.object({ id: z.string() }),
});
