import { describe, it, expect } from 'vitest';
import { prisma } from '../../shared/db';
import {
  getSummary,
  getRevenueOverTime,
  getStaffUtilization,
  getStatusBreakdown,
  getPopularServices,
} from './reports.service';

async function setupBusiness() {
  const user = await prisma.user.create({
    data: {
      email: `rpt-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: 'x',
      name: 'Owner',
    },
  });
  const business = await prisma.business.create({
    data: {
      name: 'Reports Test',
      slug: `rpt-biz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
  await prisma.workingHours.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.staff.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.service.deleteMany({ where: { businessId } }).catch(() => {});
  await prisma.business.delete({ where: { id: businessId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

async function seedLookupData(businessId: string) {
  const service = await prisma.service.create({
    data: { businessId, name: 'Haircut', durationMin: 30, price: 50, active: true },
  });
  const staff = await prisma.staff.create({
    data: { businessId, name: 'Alice', active: true },
  });
  const staff2 = await prisma.staff.create({
    data: { businessId, name: 'Bob', active: true },
  });
  const customer = await prisma.customer.create({
    data: { businessId, name: 'Client', email: 'client@example.com' },
  });
  return { service, staff, staff2, customer };
}

function utcDate(year: number, month: number, day: number, hour = 10, minute = 0) {
  return new Date(Date.UTC(year, month, day, hour, minute, 0));
}

describe('reports service', () => {
  it('summary aggregates bookings in range and excludes out-of-range ones', async () => {
    const { user, business } = await setupBusiness();
    try {
      const { service, staff, customer } = await seedLookupData(business.id);
      const inRange = utcDate(2026, 10, 7, 10, 0);
      const outOfRange = utcDate(2026, 10, 3, 10, 0);

      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: inRange,
          endAt: new Date(inRange.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 50,
        },
      });
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: new Date(inRange.getTime() + 30 * 60 * 1000),
          endAt: new Date(inRange.getTime() + 60 * 60 * 1000),
          status: 'COMPLETED',
          price: 50,
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
          status: 'CANCELLED',
          price: 50,
        },
      });

      const summary = await getSummary(business.id, {
        start: '2026-11-07',
        end: '2026-11-07',
      });

      expect(summary.totalBookings).toBe(2);
      expect(summary.totalRevenue).toBe(100);
      expect(summary.confirmedCount).toBe(1);
      expect(summary.completedCount).toBe(1);
      expect(summary.cancelledCount).toBe(0);
      expect(summary.period).toEqual({ start: '2026-11-07', end: '2026-11-07' });
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('returns zeros for an empty range', async () => {
    const { user, business } = await setupBusiness();
    try {
      const summary = await getSummary(business.id, {
        start: '2026-11-01',
        end: '2026-11-02',
      });
      expect(summary.totalBookings).toBe(0);
      expect(summary.totalRevenue).toBe(0);
      expect(summary.completionRate).toBe(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('revenue over time produces daily buckets including zero days', async () => {
    const { user, business } = await setupBusiness();
    try {
      const { service, staff, customer } = await seedLookupData(business.id);
      const d1 = utcDate(2026, 10, 7, 10, 0);
      const d2 = utcDate(2026, 10, 9, 11, 0);

      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: d1,
          endAt: new Date(d1.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 50,
        },
      });
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: d2,
          endAt: new Date(d2.getTime() + 30 * 60 * 1000),
          status: 'CANCELLED',
          price: 30,
        },
      });

      const result = await getRevenueOverTime(business.id, {
        start: '2026-11-07',
        end: '2026-11-09',
      });

      expect(result.totalRevenue).toBe(50);
      expect(result.series).toHaveLength(3);
      const byDate = Object.fromEntries(result.series.map((s) => [s.date, s]));
      expect(byDate['2026-11-07'].revenue).toBe(50);
      expect(byDate['2026-11-07'].bookings).toBe(1);
      expect(byDate['2026-11-08'].revenue).toBe(0);
      expect(byDate['2026-11-09'].revenue).toBe(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('staff utilization computes booked vs working minutes', async () => {
    const { user, business } = await setupBusiness();
    try {
      const { service, staff, staff2, customer } = await seedLookupData(business.id);
      await prisma.workingHours.create({
        data: {
          businessId: business.id,
          staffId: staff.id,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
      await prisma.workingHours.create({
        data: {
          businessId: business.id,
          staffId: staff2.id,
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      });

      const monday = utcDate(2026, 10, 9, 10, 0);
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: monday,
          endAt: new Date(monday.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 50,
        },
      });

      const utilization = await getStaffUtilization(business.id, {
        start: '2026-11-09',
        end: '2026-11-09',
      });

      const alice = utilization.find((u) => u.staffId === staff.id);
      const bob = utilization.find((u) => u.staffId === staff2.id);
      expect(alice).toBeDefined();
      expect(alice!.bookingsCount).toBe(1);
      expect(alice!.revenue).toBe(50);
      expect(alice!.bookedMinutes).toBe(30);
      expect(alice!.workingMinutes).toBe(480);
      expect(alice!.utilizationPercent).toBeCloseTo(6.25, 2);
      expect(bob!.bookingsCount).toBe(0);
      expect(bob!.utilizationPercent).toBe(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('status breakdown returns all statuses with counts and revenue', async () => {
    const { user, business } = await setupBusiness();
    try {
      const { service, staff, customer } = await seedLookupData(business.id);
      const base = utcDate(2026, 10, 7, 10, 0);
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: base,
          endAt: new Date(base.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
          price: 50,
        },
      });
      await prisma.booking.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: staff.id,
          startAt: new Date(base.getTime() + 60 * 60 * 1000),
          endAt: new Date(base.getTime() + 90 * 60 * 1000),
          status: 'CANCELLED',
          price: 25,
        },
      });

      const breakdown = await getStatusBreakdown(business.id, {
        start: '2026-11-07',
        end: '2026-11-07',
      });

      expect(breakdown).toHaveLength(5);
      const confirmed = breakdown.find((b) => b.status === 'CONFIRMED');
      const cancelled = breakdown.find((b) => b.status === 'CANCELLED');
      expect(confirmed!.count).toBe(1);
      expect(confirmed!.revenue).toBe(50);
      expect(cancelled!.count).toBe(1);
      expect(cancelled!.revenue).toBe(25);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('popular services ranks by bookings then revenue', async () => {
    const { user, business } = await setupBusiness();
    try {
      const haircut = await prisma.service.create({
        data: { businessId: business.id, name: 'Haircut', durationMin: 30, price: 50, active: true },
      });
      const color = await prisma.service.create({
        data: { businessId: business.id, name: 'Color', durationMin: 60, price: 120, active: true },
      });
      const staff = await prisma.staff.create({
        data: { businessId: business.id, name: 'Alice', active: true },
      });
      const customer = await prisma.customer.create({
        data: { businessId: business.id, name: 'Client' },
      });
      const base = utcDate(2026, 10, 7, 10, 0);
      await prisma.booking.create({
        data: { businessId: business.id, customerId: customer.id, serviceId: haircut.id, staffId: staff.id, startAt: base, endAt: new Date(base.getTime() + 30 * 60 * 1000), status: 'CONFIRMED', price: 50 },
      });
      await prisma.booking.create({
        data: { businessId: business.id, customerId: customer.id, serviceId: haircut.id, staffId: staff.id, startAt: new Date(base.getTime() + 60 * 60 * 1000), endAt: new Date(base.getTime() + 90 * 60 * 1000), status: 'CONFIRMED', price: 50 },
      });
      await prisma.booking.create({
        data: { businessId: business.id, customerId: customer.id, serviceId: color.id, staffId: staff.id, startAt: new Date(base.getTime() + 120 * 60 * 1000), endAt: new Date(base.getTime() + 180 * 60 * 1000), status: 'CONFIRMED', price: 120 },
      });

      const services = await getPopularServices(business.id, {
        start: '2026-11-07',
        end: '2026-11-07',
      });

      expect(services).toHaveLength(2);
      expect(services[0].serviceId).toBe(haircut.id);
      expect(services[0].bookings).toBe(2);
      expect(services[0].revenue).toBe(100);
      expect(services[1].serviceId).toBe(color.id);
      expect(services[1].bookings).toBe(1);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws validation error when start is after end', async () => {
    const { user, business } = await setupBusiness();
    try {
      await expect(
        getSummary(business.id, { start: '2026-11-10', end: '2026-11-07' }),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws not found for unknown business', async () => {
    await expect(getSummary('000000000000000000000000', {})).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});