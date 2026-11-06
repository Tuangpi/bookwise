import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import { reportsRangeSchema } from './reports.schema';
import {
  summary,
  revenue,
  staff,
  status,
  services,
} from './reports.controller';

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireTenant);

// GET /api/v1/reports/summary - Key performance indicators for the business
reportsRouter.get('/summary', validate(reportsRangeSchema), summary);

// GET /api/v1/reports/revenue - Daily revenue and booking time series
reportsRouter.get('/revenue', validate(reportsRangeSchema), revenue);

// GET /api/v1/reports/staff - Per-staff booking and utilization metrics
reportsRouter.get('/staff', validate(reportsRangeSchema), staff);

// GET /api/v1/reports/status - Booking count and revenue by status
reportsRouter.get('/status', validate(reportsRangeSchema), status);

// GET /api/v1/reports/services - Most booked services
reportsRouter.get('/services', validate(reportsRangeSchema), services);
