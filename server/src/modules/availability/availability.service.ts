import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';
import { DateTime } from 'luxon';

export interface AvailabilitySlot {
  startAt: string; // ISO 8601 UTC
  endAt: string;   // ISO 8601 UTC
}

export interface StaffAvailability {
  staffId: string;
  staffName: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityResult {
  date: string;
  serviceId: string;
  serviceName: string;
  durationMin: number;
  staff: StaffAvailability[];
}

type WorkingHour = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breaks: unknown;
  staffId: string | null;
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function instantOverlaps(sStart: DateTime, sEnd: DateTime, oStart: Date | string, oEnd: Date | string): boolean {
  const os = DateTime.fromJSDate(oStart as Date).toUTC();
  const oe = DateTime.fromJSDate(oEnd as Date).toUTC();
  return sStart < oe && os < sEnd;
}
/**
 * Compute available time slots for a service on a given date.
 *
 * Slots are derived from:
 *  - business / staff working hours (staff-specific overrides business-level)
 *  - the service duration
 *  - staff-service links (only linked staff are considered)
 *  - existing time-offs and bookings (slots overlapping them are removed)
 *
 * All times are evaluated in the business timezone and returned as ISO 8601 UTC
 * strings, matching the Booking.startAt / endAt representation.
 */
export async function listAvailability(
  businessId: string,
  params: { serviceId: string; date: string; staffId?: string },
): Promise<AvailabilityResult> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw Errors.notFound('Business not found');
  const tz = business.timezone || 'UTC';

  // Date window in the business timezone.
  const localStart = DateTime.fromISO(params.date, { zone: tz }).startOf('day');
  if (!localStart.isValid) throw Errors.validation('Invalid date');
  const localEnd = localStart.plus({ days: 1 });
  const utcStart = localStart.toUTC().toJSDate();
  const utcEnd = localEnd.toUTC().toJSDate();
  // luxon weekday: 1=Mon .. 7=Sun  ->  prisma dayOfWeek: 0=Sun .. 6=Sat
  const dayOfWeek = localStart.weekday % 7;

  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, businessId },
  });
  if (!service) throw Errors.notFound('Service not found');

  // Staff linked to this service (and active).
  const links = await prisma.staffService.findMany({
    where: { serviceId: params.serviceId },
    include: { staff: true },
  });
  let staffList = links
    .map((l) => l.staff)
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .filter((s) => s.active);

  if (params.staffId) {
    staffList = staffList.filter((s) => s.id === params.staffId);
    if (staffList.length === 0) {
      throw Errors.notFound('Staff not found or not linked to this service');
    }
  }

  const emptyResult: AvailabilityResult = {
    date: params.date,
    serviceId: service.id,
    serviceName: service.name,
    durationMin: service.durationMin,
    staff: [],
  };
  if (staffList.length === 0) return emptyResult;

  const staffIds = staffList.map((s) => s.id);

  const nowLocal = DateTime.now().setZone(tz);

  // Batch-load supporting data for all candidate staff on this date.
  const [businessHours, staffHours, timeOffs, bookings] = await Promise.all([
    prisma.workingHours.findMany({ where: { businessId, staffId: null } }),
    prisma.workingHours.findMany({ where: { businessId, staffId: { in: staffIds } } }),
    prisma.timeOff.findMany({
      where: { staffId: { in: staffIds }, startAt: { lt: utcEnd }, endAt: { gt: utcStart } },
    }),
    prisma.booking.findMany({
      where: {
        staffId: { in: staffIds },
        startAt: { lt: utcEnd },
        endAt: { gt: utcStart },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    }),
  ]);

  const businessHoursByDay = new Map<number, WorkingHour>();
  for (const h of businessHours) businessHoursByDay.set(h.dayOfWeek, h as unknown as WorkingHour);

  const staffHoursByKey = new Map<string, WorkingHour>();
  for (const h of staffHours) staffHoursByKey.set(`${h.staffId}:${h.dayOfWeek}`, h as unknown as WorkingHour);

  const timeOffsByStaff = new Map<string, any[]>();
  for (const to of timeOffs) {
    const arr = timeOffsByStaff.get(to.staffId) ?? [];
    arr.push(to);
    timeOffsByStaff.set(to.staffId, arr);
  }

  const bookingsByStaff = new Map<string, any[]>();
  for (const b of bookings) {
    const arr = bookingsByStaff.get(b.staffId) ?? [];
    arr.push(b);
    bookingsByStaff.set(b.staffId, arr);
  }

  const result: StaffAvailability[] = [];

  for (const staff of staffList) {
    const wh =
      staffHoursByKey.get(`${staff.id}:${dayOfWeek}`) ?? businessHoursByDay.get(dayOfWeek);
    if (!wh) {
      result.push({ staffId: staff.id, staffName: staff.name, slots: [] });
      continue; // staff/business closed this day
    }

    const ws = timeToMinutes(wh.startTime);
    const we = timeToMinutes(wh.endTime);
    const breaks: [number, number][] = Array.isArray(wh.breaks)
      ? wh.breaks.map((b: any) => [timeToMinutes(b.start), timeToMinutes(b.end)])
      : [];

    const staffTimeOffs = timeOffsByStaff.get(staff.id) ?? [];
    const staffBookings = bookingsByStaff.get(staff.id) ?? [];

    const slots: AvailabilitySlot[] = [];
    let current = ws;
    while (current + service.durationMin <= we) {
      const slotEnd = current + service.durationMin;

      const blockedByBreak = breaks.some(([bs, be]) => intervalsOverlap(current, slotEnd, bs, be));

      if (!blockedByBreak) {
        const slotStartLocal = localStart.set({ hour: Math.floor(current / 60), minute: current % 60 });
        const slotEndLocal = slotStartLocal.plus({ minutes: service.durationMin });
        const slotStartUtc = slotStartLocal.toUTC();
        const slotEndUtc = slotEndLocal.toUTC();

        // Skip slots that are fully in the past (relevant for "today").
        if (slotEndUtc.toMillis() <= nowLocal.toMillis()) {
          current += service.durationMin;
          continue;
        }

        const blockedByTimeOff = staffTimeOffs.some((to) =>
          instantOverlaps(slotStartUtc, slotEndUtc, to.startAt, to.endAt),
        );
        const blockedByBooking = staffBookings.some((b) =>
          instantOverlaps(slotStartUtc, slotEndUtc, b.startAt, b.endAt),
        );

        if (!blockedByTimeOff && !blockedByBooking) {
          slots.push({ startAt: slotStartUtc.toISO(), endAt: slotEndUtc.toISO() });
        }
      }
      current += service.durationMin;
    }

    result.push({ staffId: staff.id, staffName: staff.name, slots });
  }

  return {
    date: params.date,
    serviceId: service.id,
    serviceName: service.name,
    durationMin: service.durationMin,
    staff: result,
  };
}

