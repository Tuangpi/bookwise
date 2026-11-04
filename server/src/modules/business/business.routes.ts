import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { updateBusinessSchema } from './business.schema';
import * as c from './business.controller';

export const businessRouter = Router();
businessRouter.use(authenticate, requireTenant);
businessRouter.get('/me', c.getMe);
businessRouter.patch('/me', validate(updateBusinessSchema), c.updateMe);
