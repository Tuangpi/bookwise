import { describe, it, expect } from 'vitest';
import { prisma } from '../../shared/db';
import {
  createNotification,
  listNotifications,
  markAsSent,
  createBookingNotification,
} from './notification.service';

async function setupBusiness() {
  const user = await prisma.user.create({
    data: {
      email: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: 'x',
      name: 'Owner',
    },
  });
  const business = await prisma.business.create({
    data: {
      name: 'Notification Test',
      slug: `notif-biz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ownerId: user.id,
      timezone: 'UTC',
    },
  });
  return { user, business };
}

async function teardown(businessId: string, userId: string) {
  await prisma.notification.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.booking.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.customer.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.service.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.staff.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.business.delete({ where: { id: businessId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

describe('notification service', () => {
  it('creates, lists, and marks a notification as sent', async () => {
    const { user, business } = await setupBusiness();
    try {
      const created = await createNotification(business.id, {
        type: 'BOOKING_REMINDER',
        channel: 'EMAIL',
        recipient: 'client@example.com',
        payload: { bookingId: 'b1' },
      });

      expect(created.status).toBe('PENDING');
      expect(created.type).toBe('BOOKING_REMINDER');
      expect(created.channel).toBe('EMAIL');

      const all = await listNotifications(business.id);
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(created.id);

      const sent = await markAsSent(created.id);
      expect(sent.status).toBe('SENT');
      expect(sent.sentAt).not.toBeNull();

      const pending = await listNotifications(business.id, 'PENDING');
      expect(pending).toHaveLength(0);

      const sentList = await listNotifications(business.id, 'SENT');
      expect(sentList).toHaveLength(1);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('returns empty when no notifications exist', async () => {
    const { user, business } = await setupBusiness();
    try {
      const items = await listNotifications(business.id);
      expect(items).toHaveLength(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws not found when marking unknown notification as sent', async () => {
    const { user, business } = await setupBusiness();
    try {
      await expect(
        markAsSent('000000000000000000000000')
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('creates a booking notification with customer and service details', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await prisma.service.create({
        data: { businessId: business.id, name: 'Haircut', durationMin: 30, price: 25, active: true },
      });
      const customer = await prisma.customer.create({
        data: { businessId: business.id, name: 'Client', email: 'client@example.com' },
      });

      const booking = {
        id: 'booking-1',
        customerId: customer.id,
        serviceId: service.id,
        staffId: null,
        startAt: new Date(Date.UTC(2026, 11, 7, 10, 0, 0)),
        endAt: new Date(Date.UTC(2026, 11, 7, 10, 30, 0)),
        status: 'CONFIRMED',
        price: 25,
      };

      const notification = await createBookingNotification(business.id, booking, 'BOOKING_CONFIRMED');

      expect(notification.type).toBe('BOOKING_CONFIRMED');
      expect(notification.channel).toBe('EMAIL');
      expect(notification.recipient).toBe('client@example.com');
      expect(notification.payload).toMatchObject({
        bookingId: 'booking-1',
        serviceName: 'Haircut',
        customerName: 'Client',
      });
    } finally {
      await teardown(business.id, user.id);
    }
  });
});
