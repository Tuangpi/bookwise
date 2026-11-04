import { z } from 'zod';

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    active: z.boolean().optional(),
    serviceIds: z.array(z.string()).optional(),
  }),
});

export const updateStaffSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    bio: z.string().optional(),
    active: z.boolean().optional(),
    serviceIds: z.array(z.string()).optional(),
  }),
  params: z.object({ id: z.string() }),
});
