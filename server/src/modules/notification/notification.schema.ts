import { z } from 'zod';

export const createNotificationSchema = z.object({
  body: z.object({
    type: z.string().min(1).max(100),
    channel: z.enum(['EMAIL', 'SMS', 'IN_APP']),
    recipient: z.string().min(1),
    payload: z.record(z.any()).optional(),
  }),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
