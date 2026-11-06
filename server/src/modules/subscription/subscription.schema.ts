import { z } from 'zod';

export const SubscriptionPlanSchema = z.object({
  planCode: z.string().regex(/^(FREE|STARTER|PRO)$/, 'Invalid plan code'),
});

export const SubscriptionCancelSchema = z.object({
  confirm: z.boolean().ref val(true, 'Confirmation required'),
});