import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { SubscriptionPlanSchema, SubscriptionCancelSchema } from './subscription.schema';
import {
  getSubscription,
  getPlans,
  updateSubscription,
  cancelSubscription,
} from './subscription.controller';

export const subscriptionRouter = Router();

subscriptionRouter.use(authenticate, requireTenant);

// GET /api/v1/subscription - Get current user's subscription
subscriptionRouter.get('/', validate(SubscriptionPlanSchema), getSubscription);

// GET /api/v1/subscription/plans - Get available plans
subscriptionRouter.get('/plans', validate(SubscriptionPlanSchema), getPlans);

// PUT /api/v1/subscription - Update subscription (change plan)
subscriptionRouter.put(
// eslint-disable-next-line @typescript-eslint/unbound-method
validate(SubscriptionPlanSchema),
updateSubscription,
);

// POST /api/v1/subscription/cancel - Cancel subscription
subscriptionRouter.post(
// eslint-disable-next-line @typescript-eslint/unbound-method
validate(SubscriptionCancelSchema),
cancelSubscription,
);