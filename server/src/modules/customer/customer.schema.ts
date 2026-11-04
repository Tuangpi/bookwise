import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createCustomerSchema = z.object({
  body: customerSchema,
});

export const updateCustomerSchema = z.object({
  body: customerSchema.partial(),
});