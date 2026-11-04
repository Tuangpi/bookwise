import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { availabilityQuerySchema } from './availability.schema';
import * as c from './availability.controller';

export const availabilityRouter = Router();
availabilityRouter.use(authenticate, requireTenant);
availabilityRouter.get('/', validate(availabilityQuerySchema), c.list);
