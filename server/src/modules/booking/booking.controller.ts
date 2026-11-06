import { Response, NextFunction } from "express";
import { AuthRequest } from "../../shared/middleware/auth";
import * as svc from "./booking.service";
import { createBookingSchema, updateBookingSchema } from "./booking.schema";

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const { serviceId, staffId, startAt, endAt, notes } = createBookingSchema.parse(body);

    const customerId = req.user!.id; // authenticated user

    const booking = await svc.createBooking(
      req.businessId!,
      customerId,
      serviceId,
      staffId ?? null,
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

export async function calendar(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const startAt = start ? new Date(start) : new Date();
    startAt.setHours(0, 0, 0, 0);
    const endAt = end ? new Date(end) : new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    endAt.setHours(23, 59, 59, 999);

    const bookings = await svc.listBookingsInRange(req.businessId!, startAt, endAt);

    res.json({ success: true, data: bookings });
  } catch (e) {
    next(e);
  }
}