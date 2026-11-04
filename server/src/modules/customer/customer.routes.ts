import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customer.schema';
import * as c from './customer.controller';

export const customerRouter = Router();
customerRouter.use(authenticate, requireTenant);
customerRouter.get('/', c.list);
customerRouter.post('/', validate(createCustomerSchema), c.create);
customerRouter.patch('/:id', validate(updateCustomerSchema), c.update);
customerRouter.delete('/:id', c.remove);