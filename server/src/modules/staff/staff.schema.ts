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

export const staffHoursSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z
    .object({
      hours: z.array(daySchema).max(7),
    })
    .refine((v) => new Set(v.hours.map((h) => h.dayOfWeek)).size === v.hours.length, {
      message: 'duplicate dayOfWeek',
      path: ['hours'],
    }),
});
