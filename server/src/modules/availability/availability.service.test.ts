import { describe, it, expect } from 'vitest';
import { prisma } from '../../shared/db';
import { listAvailability } from './availability.service';

const DATE = '2026-12-07'; // Monday

async function setupBusiness() {
  const user = await prisma.user.create({
    data: {
      email: `av-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      passwordHash: 'x',
      name: 'Owner',
    },
  });
  const business = await prisma.business.create({
    data: {
      name: 'Availability Test',
      slug: `av-biz-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ownerId: user.id,
      timezone: 'UTC',
    },
  });
  return { user, business };
}

async function teardown(businessId: string, userId: string) {
  await prisma.business.delete({ where: { id: businessId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

async function createService(businessId: string, durationMin = 30) {
  return prisma.service.create({
    data: { businessId, name: 'Haircut', durationMin, price: 25, active: true },
  });
}

async function createStaff(businessId: string, name: string, active = true) {
  return prisma.staff.create({ data: { businessId, name, active } });
}

async function linkStaffService(staffId: string, serviceId: string) {
  return prisma.staffService.create({ data: { staffId, serviceId } });
}

async function setWorkingHours(
  businessId: string,
  staffId: string | null,
  dayOfWeek: number,
  startTime = '09:00',
  endTime = '17:00',
  breaks: any = null,
) {
  return prisma.workingHours.create({
    data: { businessId, staffId, dayOfWeek, startTime, endTime, breaks },
  });
}

async function createBooking(businessId: string, serviceId: string, staffId: string, startAt: Date, endAt: Date) {
  const customer = await prisma.customer.create({
    data: { businessId, name: 'Walk-in Customer' },
  });
  return prisma.booking.create({
    data: {
      businessId,
      customerId: customer.id,
      serviceId,
      staffId,
      startAt,
      endAt,
      price: 50,
      status: 'CONFIRMED',
    },
  });
}

async function createTimeOff(staffId: string, startAt: Date, endAt: Date) {
  return prisma.timeOff.create({ data: { staffId, startAt, endAt, reason: 'Sick leave' } });
}

describe('availability service', () => {
  it('returns duration-aligned slots within staff working hours', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Alice');
      await linkStaffService(staff.id, service.id);
      await setWorkingHours(business.id, staff.id, 1, '09:00', '17:00');

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      expect(result.serviceId).toBe(service.id);
      expect(result.durationMin).toBe(30);
      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].staffId).toBe(staff.id);
      expect(result.staff[0].slots).toHaveLength(16);
      expect(result.staff[0].slots[0]).toEqual({
        startAt: '2026-12-07T09:00:00.000Z',
        endAt: '2026-12-07T09:30:00.000Z',
      });
      expect(result.staff[0].slots[15]).toEqual({
        startAt: '2026-12-07T16:30:00.000Z',
        endAt: '2026-12-07T17:00:00.000Z',
      });
    } finally {
      await teardown(business.id, user.id);
    }
  });
  it('returns no slots when staff has no working hours that day', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Bob');
      await linkStaffService(staff.id, service.id);

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].slots).toHaveLength(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('excludes staff not linked to the service', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const linked = await createStaff(business.id, 'Alice');
      const notLinked = await createStaff(business.id, 'Carol');
      await linkStaffService(linked.id, service.id);
      await setWorkingHours(business.id, linked.id, 1, '09:00', '17:00');
      await setWorkingHours(business.id, notLinked.id, 1, '09:00', '17:00');

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].staffId).toBe(linked.id);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('excludes slots overlapping an existing booking', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Alice');
      await linkStaffService(staff.id, service.id);
      await setWorkingHours(business.id, staff.id, 1, '09:00', '17:00');
      await createBooking(business.id, service.id, staff.id, new Date('2026-12-07T10:00:00.000Z'), new Date('2026-12-07T10:30:00.000Z'));

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      const slots = result.staff[0].slots;
      expect(slots).toHaveLength(15);
      expect(slots.some((s) => s.startAt === '2026-12-07T10:00:00.000Z')).toBe(false);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('excludes slots overlapping a time-off', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Alice');
      await linkStaffService(staff.id, service.id);
      await setWorkingHours(business.id, staff.id, 1, '09:00', '17:00');
      await createTimeOff(staff.id, new Date('2026-12-07T13:00:00.000Z'), new Date('2026-12-07T14:00:00.000Z'));

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      const slots = result.staff[0].slots;
      expect(slots).toHaveLength(14);
      expect(slots.some((s) => s.startAt === '2026-12-07T13:00:00.000Z')).toBe(false);
      expect(slots.some((s) => s.startAt === '2026-12-07T13:30:00.000Z')).toBe(false);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('excludes slots that would cross a break', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 60);
      const staff = await createStaff(business.id, 'Alice');
      await linkStaffService(staff.id, service.id);
      await setWorkingHours(business.id, staff.id, 1, '09:00', '17:00');
      const wh = await prisma.workingHours.findFirst({
        where: { businessId: business.id, staffId: staff.id, dayOfWeek: 1 },
      });
      await prisma.workingHours.update({
        where: { id: wh!.id },
        data: { breaks: [{ start: '12:00', end: '13:00' }] },
      });

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      const starts = result.staff[0].slots.map((s) => s.startAt);
      expect(starts).not.toContain('2026-12-07T12:00:00.000Z');
      expect(result.staff[0].slots).toHaveLength(7);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('falls back to business hours when staff has no specific hours', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Alice');
      await linkStaffService(staff.id, service.id);
      await setWorkingHours(business.id, null, 1, '10:00', '14:00');

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].slots).toHaveLength(8);
      expect(result.staff[0].slots[0].startAt).toBe('2026-12-07T10:00:00.000Z');
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('filters by optional staffId', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const alice = await createStaff(business.id, 'Alice');
      const bob = await createStaff(business.id, 'Bob');
      await linkStaffService(alice.id, service.id);
      await linkStaffService(bob.id, service.id);
      await setWorkingHours(business.id, alice.id, 1, '09:00', '17:00');
      await setWorkingHours(business.id, bob.id, 1, '09:00', '17:00');

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE, staffId: bob.id });

      expect(result.staff).toHaveLength(1);
      expect(result.staff[0].staffId).toBe(bob.id);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('returns empty when service has no active staff', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      await createStaff(business.id, 'Inactive', false);

      const result = await listAvailability(business.id, { serviceId: service.id, date: DATE });

      expect(result.staff).toHaveLength(0);
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws validation error for invalid date', async () => {
    const { user, business } = await setupBusiness();
    try {
      await expect(listAvailability(business.id, { serviceId: 'some-id', date: 'not-a-date' })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      });
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws not found for unknown service', async () => {
    const { user, business } = await setupBusiness();
    try {
      await expect(listAvailability(business.id, { serviceId: '000000000000000000000000', date: DATE })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await teardown(business.id, user.id);
    }
  });

  it('throws not found for staff not linked to service', async () => {
    const { user, business } = await setupBusiness();
    try {
      const service = await createService(business.id, 30);
      const staff = await createStaff(business.id, 'Alice');

      await expect(listAvailability(business.id, { serviceId: service.id, date: DATE, staffId: staff.id })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    } finally {
      await teardown(business.id, user.id);
    }
  });
});

