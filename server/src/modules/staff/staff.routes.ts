import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { createStaffSchema, updateStaffSchema, staffHoursSchema } from './staff.schema';
import * as c from './staff.controller';

export const staffRouter = Router();
staffRouter.use(authenticate, requireTenant);
staffRouter.get('/', c.list);
staffRouter.post('/', validate(createStaffSchema), c.create);
staffRouter.patch('/:id', validate(updateStaffSchema), c.update);
staffRouter.delete('/:id', c.remove);
staffRouter.get('/:id/hours', c.getHours);
staffRouter.put('/:id/hours', validate(staffHoursSchema), c.setHours);
