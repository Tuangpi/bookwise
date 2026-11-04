import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { createServiceSchema, updateServiceSchema } from './service.schema';
import * as c from './service.controller';

export const serviceRouter = Router();
serviceRouter.use(authenticate, requireTenant);
serviceRouter.get('/', c.list);
serviceRouter.post('/', validate(createServiceSchema), c.create);
serviceRouter.patch('/:id', validate(updateServiceSchema), c.update);
serviceRouter.delete('/:id', c.remove);
