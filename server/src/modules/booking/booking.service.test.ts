import { describe, it, expect } from 'vitest';
import { prisma } from '../../shared/db';
import { listBookingsInRange } from './booking.service';

async function setupBusiness() {
  const user = await prisma.user.create({
    data: {
      email: `cal-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: 'x',
      name: 'Owner',
    },
  });
  const business = await prisma.business.create({
    data: {
      name: 'Calendar Test',
      slug: `cal-biz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ownerId: user.id,
      timezone: 'UTC',
    },
  });
  return { user, business };
}

async function teardown(businessId: string, userId: string) {
  await prisma.booking.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.customer.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.staffService.deleteMany({ where: { staff: { businessId } } }).catch(() => {});
  await prisma.staff.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.service.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.business.delete({ where: { id: businessId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

describe('booking service - listBookingsInRange', () => {
  it('returns bookings within the date range and excludes those outside', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await prisma.service.create({
        data: { businessId: business.id, name: 'Haircut', durationMin: 30, price: 25, active: true },
      });
      const staff = await prisma.staff.create({
        data: { businessId: business.id, name: 'Alice', active: true },
      });
      const customer = await prisma.customer.create({
        data: { businessId: business.id, name: 'Client' },
      });

      const inRange = new Date(Date.UTC(2026, 11, 7, 10, 0, 0)); // 2026-12-07 10:00 UTC
      const outOfRange = new Date(Date.UTC(2026, 11, 10, 10, 0, 0)); // 2026-12-10 (outside window)

      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: inRange,
          endAt: new Date(inRange.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 25,
        },
      });
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: outOfRange,
          endAt: new Date(outOfRange.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 25,
        },
      });

      const start = new Date(Date.UTC(2026, 11, 7, 0, 0, 0));
      const end = new Date(Date.UTC(2026, 11, 8, 23, 59, 59));
      const bookings = await listBookingsInRange(business.id, start, end);

      expect(bookings).toHaveLength(1);
      expect(bookings[0].customerId).toBe(customer.id);
      expect(bookings[0].customer.name).toBe('Client');
      expect(bookings[0].service.name).toBe('Haircut');
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('returns empty when there are no bookings in the range', async () => {
    const { user, business } = await setupBusiness();
    try {
      const start = new Date(Date.UTC(2026, 11, 7, 0, 0, 0));
      const end = new Date(Date.UTC(2026, 11, 8, 23, 59, 59));
      const bookings = await listBookingsInRange(business.id, start, end);
      expect(bookings).toHaveLength(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });
});
