import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    businessName: z.string().min(2).max(100),
    ownerName: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    phone: z.string().optional(),
    timezone: z.string().default('UTC'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});
