import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { updateBusinessSchema, businessHoursSchema } from './business.schema';
import * as c from './business.controller';

export const businessRouter = Router();
businessRouter.use(authenticate, requireTenant);
businessRouter.get('/me', c.getMe);
businessRouter.patch('/me', validate(updateBusinessSchema), c.updateMe);
businessRouter.get('/me/hours', c.getHours);
businessRouter.put('/me/hours', validate(businessHoursSchema), c.setHours);
