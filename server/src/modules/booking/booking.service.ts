import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';
import { listAvailability } from '../availability/availability.service';
import type { UpdateBookingInput } from './booking.schema';
import { createBookingNotification } from '../notification/notification.service';

export interface Booking {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  status: string;
  notes?: string | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function createBooking(
  businessId: string,
  customerId: string,
  serviceId: string,
  staffId: string | null,
  startAt: Date,
  endAt: Date,
  notes?: string
) {
  // Validate that the service exists and belongs to the business
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId },
  });
  if (!service) {
    throw Errors.notFound('Service not found');
  }

  // Validate staff if provided
  if (staffId) {
    const existingStaff = await prisma.staff.findFirst({
      where: { id: staffId, businessId },
    });
    if (!existingStaff) {
      throw Errors.notFound('Staff not found or not associated with this business');
    }
  }

  // If no staff specified, try to auto-detect from service links
  let finalStaffId = staffId;
  if (!finalStaffId) {
    const links = await prisma.staffService.findMany({
      where: { serviceId },
      include: { staff: true },
    });
    const activeStaff = links.filter((l) => l.staff && l.staff.active);
    if (activeStaff.length > 0) {
      finalStaffId = activeStaff[0].staff.id;
    }
  }

  if (!finalStaffId) {
    throw Errors.conflict('No staff available for this service');
  }

  const availability = await listAvailability(businessId, {
    serviceId,
    date: startAt.toISOString().split('T')[0],
    staffId: finalStaffId,
  });

    const staffAvailable = availability.staff.some((s) =>
      s.slots.some(
        (slot) =>
          slot.startAt >= startAt.toISOString() && slot.endAt <= endAt.toISOString()
      )
    );

    if (!staffAvailable) {
      throw Errors.conflict('Selected time slot is not available for the specified staff');
    }

  // Calculate price based on service price
  const price = service.price;

  // Create the booking
  const booking = await prisma.booking.create({
    data: {
      businessId,
      customerId,
      serviceId,
      staffId: finalStaffId,
      startAt,
      endAt,
      status: 'PENDING',
      notes,
      price,
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      staff: { select: { id: true, name: true } },
    },
  });

  const result: Booking = {
    id: booking.id,
    businessId: booking.businessId,
    customerId: booking.customerId,
    serviceId: booking.serviceId,
    staffId: booking.staffId,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: booking.status,
    notes: booking.notes,
    price: booking.price.toNumber(),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };

  // Fire-and-forget notification for the new booking
  void createBookingNotification(booking.businessId, result, 'BOOKING_CREATED').catch(() => {});

  return result;
}

export async function listBookings(
  businessId: string,
  statusFilter?: string
) {
  const where: any = { businessId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  return prisma.booking.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      staff: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'desc' },
  });
}

export async function getBooking(
  businessId: string,
  bookingId: string
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      staff: { select: { id: true, name: true } },
    },
  });

  if (!booking) {
    throw Errors.notFound('Booking not found');
  }

  return booking;
}

export async function updateBooking(
  businessId: string,
  bookingId: string,
  data: UpdateBookingInput
) {
    const booking = await prisma.booking.findFirst({
        where: { id: bookingId, businessId },
    });
    if (!booking) {
        throw Errors.notFound('Booking not found');
    }

    const previousStatus = booking.status;

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: data.status,
            notes: data.notes,
        },
    });

    // Notify when booking is confirmed
    if (data.status && data.status !== previousStatus && data.status === 'CONFIRMED') {
      void createBookingNotification(businessId, {
        id: updated.id,
        customerId: updated.customerId,
        serviceId: updated.serviceId,
        staffId: updated.staffId,
        startAt: updated.startAt,
        endAt: updated.endAt,
        status: updated.status,
        price: updated.price.toNumber(),
      }, 'BOOKING_CONFIRMED').catch(() => {});
    }

    return updated;
}

export async function cancelBooking(
    businessId: string,
    bookingId: string
) {
        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, businessId },
        });
        if (!booking) {
            throw Errors.notFound('Booking not found');
        }

        return prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' },
        });
    }

export async function listBookingsInRange(
  businessId: string,
  startAt: Date,
  endAt: Date
) {
  return prisma.booking.findMany({
    where: {
      businessId,
      startAt: { gte: startAt, lte: endAt },
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true, price: true } },
      staff: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
  });
}