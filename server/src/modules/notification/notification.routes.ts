import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { createNotificationSchema } from './notification.schema';
import * as c from './notification.controller';

export const notificationRouter = Router();
notificationRouter.use(authenticate, requireTenant);
notificationRouter.get('/', c.list);
notificationRouter.post('/', validate(createNotificationSchema), c.create);
notificationRouter.patch('/:id/sent', c.markSent);
