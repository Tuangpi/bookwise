import { Router } from 'express';
import { authenticate, requirePlatformAdmin } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { updateBusinessSchema } from '../business/business.schema';
import * as c from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requirePlatformAdmin);

// GET /api/v1/admin/businesses - List all businesses (platform admin)
adminRouter.get('/businesses', validate(updateBusinessSchema), c.listBusinesses);

// GET /api/v1/admin/businesses/:businessId - Get business details
adminRouter.get('/businesses/:businessId', c.getBusiness);

// PUT /api/v1/admin/businesses/:businessId - Update business
adminRouter.put('/businesses/:businessId', validate(updateBusinessSchema), c.updateBusiness);

// DELETE /api/v1/admin/businesses/:businessId - Delete business
adminRouter.delete('/businesses/:businessId', c.deleteBusiness);

// GET /api/v1/admin/users - List all users in a business
adminRouter.get('/users', c.listUsers);

// PUT /api/v1/admin/users/:userId/role - Update user role
adminRouter.put('/users/:userId/role', c.updateUserRole);