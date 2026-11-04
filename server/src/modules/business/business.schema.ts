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

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const breakSchema = z.object({
  start: z.string().regex(timeRegex),
  end: z.string().regex(timeRegex),
});

const daySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex),
    endTime: z.string().regex(timeRegex),
    breaks: z.array(breakSchema).optional(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })
  .refine(
    (d) => !d.breaks || d.breaks.every((b) => b.start >= d.startTime && b.end <= d.endTime && b.start < b.end),
    { message: 'breaks must fall within working hours', path: ['breaks'] },
  );

export const businessHoursSchema = z.object({
  body: z
    .object({
      hours: z.array(daySchema).max(7),
    })
    .refine((v) => new Set(v.hours.map((h) => h.dayOfWeek)).size === v.hours.length, {
      message: 'duplicate dayOfWeek',
      path: ['hours'],
    }),
});
