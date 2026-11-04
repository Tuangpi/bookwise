import { Router } from 'express';
import { authenticate, requireTenant } from '../../shared/middleware/auth';
import { validate } from '../../shared/middleware/validate';
import {
  createBookingSchema,
  updateBookingSchema,
} from './booking.schema';
import {
  create,
  list,
  get,
  update,
  cancel,
} from './booking.controller';

export const bookingRouter = Router();

bookingRouter.use(authenticate, requireTenant);

// POST /api/v1/bookings - Create a new booking
bookingRouter.post(
  '/',
  validate(createBookingSchema),
  create
);

// GET /api/v1/bookings - List bookings for the business
bookingRouter.get('/', list);

// GET /api/v1/bookings/:id - Get a specific booking
bookingRouter.get('/:id', get);

// PATCH /api/v1/bookings/:id - Update booking status/notes
bookingRouter.patch(
  '/:id',
  validate(updateBookingSchema),
  update
);

// DELETE /api/v1/bookings/:id - Cancel a booking
bookingRouter.delete('/:id', cancel);