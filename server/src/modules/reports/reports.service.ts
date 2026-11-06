import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';
import { DateTime } from 'luxon';

export interface ReportBooking {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  status: string;
  notes: string | null;
  price: number;
  service: {
    id: string;
    name: string;
    price: number;
    durationMin: number;
  } | null;
  staff: { id: string; name: string } | null;
}

export interface ReportsRangeInput {
  start?: string;
  end?: string;
}

const REVENUE_STATUSES = new Set(['CONFIRMED', 'COMPLETED']);
const NON_CANCELLED_STATUSES = new Set([
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'NO_SHOW',
]);
const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

function toPlainPrice(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function toPlainBooking(booking: unknown): ReportBooking {
  const b = booking as Record<string, unknown>;
  return {
    id: b.id as string,
    businessId: b.businessId as string,
    customerId: b.customerId as string,
    serviceId: b.serviceId as string,
    staffId: (b.staffId as string) ?? null,
    startAt: b.startAt as Date,
    endAt: b.endAt as Date,
    status: (b.status as string) ?? 'PENDING',
    notes: (b.notes as string | null) ?? null,
    price: toPlainPrice(b.price),
    service: b.service
      ? {
          id: (b.service as Record<string, unknown>).id as string,
          name: (b.service as Record<string, unknown>).name as string,
          price: toPlainPrice((b.service as Record<string, unknown>).price),
          durationMin: Number((b.service as Record<string, unknown>).durationMin),
        }
      : null,
    staff: (b.staff as { id: string; name: string } | null) ?? null,
  };
}

interface ResolvedRange {
  tz: string;
  start: Date; // inclusive UTC JSDate
  end: Date; // inclusive UTC JSDate
  startLocal: string; // YYYY-MM-DD
  endLocal: string; // YYYY-MM-DD
}

/**
 * Resolve the report date range in the business timezone.
 * Defaults to the last 30 days (inclusive) ending today when bounds are omitted.
 */
async function resolveRange(
  businessId: string,
  input: ReportsRangeInput,
): Promise<ResolvedRange> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { timezone: true },
  });
  if (!business) throw Errors.notFound('Business not found');
  const tz = business.timezone || 'UTC';

  const endLocal = input.end
    ? DateTime.fromISO(input.end, { zone: tz }).endOf('day')
    : DateTime.now().setZone(tz).endOf('day');
  if (!endLocal.isValid) throw Errors.validation('Invalid end date');

  const startLocal = input.start
    ? DateTime.fromISO(input.start, { zone: tz }).startOf('day')
    : endLocal.minus({ days: 29 }).startOf('day');
  if (!startLocal.isValid) throw Errors.validation('Invalid start date');

  if (startLocal > endLocal) {
    throw Errors.validation('Start date must be before or equal to end date');
  }

  return {
    tz,
    start: startLocal.toUTC().toJSDate(),
    end: endLocal.toUTC().toJSDate(),
    startLocal: startLocal.toISODate(),
    endLocal: endLocal.toISODate(),
  };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}

function localDateString(date: Date, tz: string): string {
  return DateTime.fromJSDate(date, { zone: tz }).toISODate();
}

async function fetchBookingsInRange(
  businessId: string,
  input: ReportsRangeInput,
): Promise<ReportBooking[]> {
  const { start, end } = await resolveRange(businessId, input);
  const bookings = await prisma.booking.findMany({
    where: {
      businessId,
      startAt: { gte: start, lte: end },
    },
    include: {
      service: {
        select: { id: true, name: true, price: true, durationMin: true },
      },
      staff: { select: { id: true, name: true } },
    },
    orderBy: { startAt: 'asc' },
  });
  return bookings.map(toPlainBooking);
}

export async function getSummary(
  businessId: string,
  input: ReportsRangeInput,
) {
  const { start, end, startLocal, endLocal } = await resolveRange(
    businessId,
    input,
  );
  const bookings = await prisma.booking.findMany({
    where: { businessId, startAt: { gte: start, lte: end } },
  });
  const plain = bookings.map(toPlainBooking);

  const totalBookings = plain.length;
  const totalRevenue = plain
    .filter((b) => REVENUE_STATUSES.has(b.status))
    .reduce((sum, b) => sum + b.price, 0);
  const confirmedCount = plain.filter((b) => b.status === 'CONFIRMED').length;
  const completedCount = plain.filter((b) => b.status === 'COMPLETED').length;
  const cancelledCount = plain.filter((b) => b.status === 'CANCELLED').length;
  const noShowCount = plain.filter((b) => b.status === 'NO_SHOW').length;
  const pendingCount = plain.filter((b) => b.status === 'PENDING').length;

  return {
    totalBookings,
    totalRevenue,
    confirmedCount,
    completedCount,
    cancelledCount,
    noShowCount,
    pendingCount,
    completionRate: totalBookings ? (completedCount / totalBookings) * 100 : 0,
    averageRevenuePerBooking:
      totalBookings > 0 ? totalRevenue / totalBookings : 0,
    period: { start: startLocal, end: endLocal },
  };
}

export async function getRevenueOverTime(
  businessId: string,
  input: ReportsRangeInput,
) {
  const { start, end, tz } = await resolveRange(businessId, input);
  const bookings = (await fetchBookingsInRange(businessId, input)).filter(
    (b) => REVENUE_STATUSES.has(b.status),
  );

  const revenueByDay = new Map<string, { revenue: number; bookings: number }>();
  let cursor = DateTime.fromJSDate(start, { zone: tz }).startOf('day');
  const endLocal = DateTime.fromJSDate(end, { zone: tz }).startOf('day');
  while (cursor <= endLocal) {
    revenueByDay.set(cursor.toISODate(), { revenue: 0, bookings: 0 });
    cursor = cursor.plus({ days: 1 });
  }

  for (const b of bookings) {
    const day = localDateString(b.startAt, tz);
    const entry = revenueByDay.get(day);
    if (entry) {
      entry.revenue += b.price;
      entry.bookings += 1;
    }
  }

  const series = [...revenueByDay.entries()].map(([date, value]) => ({
    date,
    ...value,
  }));
  const totalRevenue = series.reduce((sum, day) => sum + day.revenue, 0);

  return { series, totalRevenue };
}

export async function getStaffUtilization(
  businessId: string,
  input: ReportsRangeInput,
) {
  const { start, end, tz } = await resolveRange(businessId, input);
  const bookings = await fetchBookingsInRange(businessId, input);

  const staffList = await prisma.staff.findMany({
    where: { businessId },
    select: { id: true, name: true, active: true },
  });
  const staffIds = staffList.map((s) => s.id);

  const [staffHours, businessHours] = await Promise.all([
    staffIds.length
      ? prisma.workingHours.findMany({
          where: { businessId, staffId: { in: staffIds } },
        })
      : Promise.resolve([]),
    prisma.workingHours.findMany({
      where: { businessId, staffId: null },
    }),
  ]);

  const staffHoursByKey = new Map<string, any[]>();
  for (const h of staffHours) {
    const arr = staffHoursByKey.get(`${h.staffId}:${h.dayOfWeek}`) ?? [];
    arr.push(h);
    staffHoursByKey.set(`${h.staffId}:${h.dayOfWeek}`, arr);
  }
  const businessHoursByDay = new Map<number, any>();
  for (const h of businessHours) businessHoursByDay.set(h.dayOfWeek, h);

  const bookedMinutesByStaff = new Map<string, number>();
  const revenueByStaff = new Map<string, number>();
  const countByStaff = new Map<string, number>();
  for (const staff of staffList) {
    bookedMinutesByStaff.set(staff.id, 0);
    revenueByStaff.set(staff.id, 0);
    countByStaff.set(staff.id, 0);
  }
  for (const b of bookings) {
    if (!b.staffId || !NON_CANCELLED_STATUSES.has(b.status)) continue;
    bookedMinutesByStaff.set(
      b.staffId,
      (bookedMinutesByStaff.get(b.staffId) ?? 0) +
        minutesBetween(b.startAt, b.endAt),
    );
    revenueByStaff.set(
      b.staffId,
      (revenueByStaff.get(b.staffId) ?? 0) + b.price,
    );
    countByStaff.set(b.staffId, (countByStaff.get(b.staffId) ?? 0) + 1);
  }

  // Prisma dayOfWeek: 0 = Sun .. 6 = Sat. Luxon weekday: 1 = Mon .. 7 = Sun.
  function prismaWeekday(local: DateTime): number {
    return local.weekday % 7;
  }

  function workingMinutesForDay(
    staffId: string | null,
    local: DateTime,
  ): number {
    const dayOfWeek = prismaWeekday(local);
    const candidates =
      staffId !== null ? (staffHoursByKey.get(`${staffId}:${dayOfWeek}`) ?? []) : [];
    const hour =
      candidates.length > 0
        ? candidates[candidates.length - 1]
        : businessHoursByDay.get(dayOfWeek);
    if (!hour) return 0;
    const startMin = typeof hour.startTime === 'string' ? timeToMinutes(hour.startTime) : 0;
    const endMin = typeof hour.endTime === 'string' ? timeToMinutes(hour.endTime) : 0;
    let breakMin = 0;
    if (Array.isArray(hour.breaks)) {
      for (const br of hour.breaks) {
        breakMin +=
          timeToMinutes((br as { end: string; start: string }).end) -
          timeToMinutes((br as { end: string; start: string }).start);
      }
    }
    return Math.max(0, endMin - startMin - breakMin);
  }

  const result: Array<{
    staffId: string;
    staffName: string;
    active: boolean;
    bookingsCount: number;
    revenue: number;
    bookedMinutes: number;
    workingMinutes: number;
    utilizationPercent: number;
  }> = [];

  let cursor = DateTime.fromJSDate(start, { zone: tz }).startOf('day');
  const endLocalDay = DateTime.fromJSDate(end, { zone: tz }).startOf('day');
  const workingMinutesByStaff = new Map<string, number>();
  for (const staff of staffList) workingMinutesByStaff.set(staff.id, 0);
  while (cursor <= endLocalDay) {
    for (const staff of staffList) {
      const wm = workingMinutesForDay(staff.id, cursor);
      workingMinutesByStaff.set(
        staff.id,
        (workingMinutesByStaff.get(staff.id) ?? 0) + wm,
      );
    }
    cursor = cursor.plus({ days: 1 });
  }

  for (const staff of staffList) {
    const booked = bookedMinutesByStaff.get(staff.id) ?? 0;
    const working = workingMinutesByStaff.get(staff.id) ?? 0;
    result.push({
      staffId: staff.id,
      staffName: staff.name,
      active: staff.active,
      bookingsCount: countByStaff.get(staff.id) ?? 0,
      revenue: revenueByStaff.get(staff.id) ?? 0,
      bookedMinutes: booked,
      workingMinutes: working,
      utilizationPercent:
        working > 0 ? Math.min(100, (booked / working) * 100) : 0,
    });
  }

  result.sort((a, b) => b.revenue - a.revenue);
  return result;
}

export async function getStatusBreakdown(
  businessId: string,
  input: ReportsRangeInput,
) {
  const { start, end } = await resolveRange(businessId, input);
  const bookings = await prisma.booking.findMany({
    where: { businessId, startAt: { gte: start, lte: end } },
  });
  const plain = bookings.map(toPlainBooking);

  return ALL_STATUSES.map((status) => {
    const items = plain.filter((b) => b.status === status);
    return {
      status,
      count: items.length,
      revenue: items.reduce((sum, b) => sum + b.price, 0),
    };
  });
}

export async function getPopularServices(
  businessId: string,
  input: ReportsRangeInput,
) {
  const { start, end } = await resolveRange(businessId, input);
  const bookings = await prisma.booking.findMany({
    where: { businessId, startAt: { gte: start, lte: end } },
    include: {
      service: { select: { id: true, name: true, price: true, durationMin: true } },
    },
  });
  const plain = bookings.map(toPlainBooking);

  const byService = new Map<
    string,
    {
      serviceId: string;
      name: string;
      bookings: number;
      revenue: number;
      totalDurationMin: number;
    }
  >();
  for (const b of plain) {
    if (!b.service) continue;
    const entry =
      byService.get(b.serviceId) ?? {
        serviceId: b.service.id,
        name: b.service.name,
        bookings: 0,
        revenue: 0,
        totalDurationMin: 0,
      };
    entry.bookings += 1;
    entry.revenue += b.price;
    entry.totalDurationMin += b.service.durationMin;
    byService.set(b.serviceId, entry);
  }

  return [...byService.values()].sort(
    (a, b) => b.bookings - a.bookings || b.revenue - a.revenue,
  );
}
