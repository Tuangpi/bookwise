import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';

export interface Notification {
  id: string;
  businessId: string;
  type: string;
  channel: string;
  recipient: string;
  payload: unknown;
  status: string;
  sentAt: Date | null;
  createdAt: Date;
}

export async function createNotification(
  businessId: string,
  data: {
    type: string;
    channel: 'EMAIL' | 'SMS' | 'IN_APP';
    recipient: string;
    payload?: Record<string, unknown>;
  }
) {
  return prisma.notification.create({
    data: {
      businessId,
      type: data.type,
      channel: data.channel,
      recipient: data.recipient,
      payload: (data.payload ?? {}) as any,
      status: 'PENDING',
    },
  });
}

export async function listNotifications(
  businessId: string,
  statusFilter?: string
) {
  const where: any = { businessId };
  if (statusFilter) {
    where.status = statusFilter;
  }

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function markAsSent(id: string) {
  const notification = await prisma.notification.findFirst({ where: { id } });
  if (!notification) {
    throw Errors.notFound('Notification not found');
  }

  return prisma.notification.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
  });
}

export type BookingSummary = {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string | null;
  startAt: Date;
  endAt: Date;
  status: string;
  price: number;
};

export type NotificationType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_REMINDER';

export async function createBookingNotification(
  businessId: string,
  booking: BookingSummary,
  type: NotificationType
) {
  const customer = await prisma.customer.findFirst({
    where: { id: booking.customerId, businessId },
  });
  const service = await prisma.service.findFirst({
    where: { id: booking.serviceId, businessId },
  });

  if (!customer || !service) {
    throw Errors.notFound('Customer or service not found');
  }

  const channel = customer.email ? 'EMAIL' : 'IN_APP';
  const recipient = customer.email || customer.phone || customer.id;

  return createNotification(businessId, {
    type,
    channel,
    recipient,
    payload: {
      bookingId: booking.id,
      serviceName: service.name,
      serviceDurationMin: service.durationMin,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: booking.status,
      price: booking.price,
      customerName: customer.name,
      customerEmail: customer.email,
    },
  });
}
