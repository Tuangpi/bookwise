import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import * as svc from "./booking.service";
import { createBookingSchema, updateBookingSchema } from "./booking.schema";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const { serviceId, staffId, startAt, endAt, notes } = createBookingSchema.parse(body);

    const customerId = req.user?.id; // authenticated user

    const booking = await svc.createBooking(
      req.businessId!,
      customerId,
      serviceId,
      staffId,
      new Date(startAt),
      new Date(endAt),
      notes
    );

    res.status(201).json({ success: true, data: booking });
  } catch (e) {
    next(e);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const bookings = await svc.listBookings(req.businessId!, status as string | undefined);

    res.json({ success: true, data: bookings });
  } catch (e) {
    next(e);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params;
    const booking = await svc.getBooking(req.businessId!, bookingId);

    res.json({ success: true, data: booking });
  } catch (e) {
    next(e);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body, params } = (req as any).validated ?? { body: req.body, params: req.params };
    const { bookingId } = params;
    const { status, notes } = updateBookingSchema.parse(body);

    const booking = await svc.updateBooking(req.businessId!, bookingId, { status, notes });

    res.json({ success: true, data: booking });
  } catch (e) {
    next(e);
  }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params;
    const booking = await svc.cancelBooking(req.businessId!, bookingId);

    res.json({ success: true, data: booking });
  } catch (e) {
    next(e);
  }
}