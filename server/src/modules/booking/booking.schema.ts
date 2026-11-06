import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string(),
  staffId: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const calendarQuerySchema = z.object({
  query: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
  }),
});