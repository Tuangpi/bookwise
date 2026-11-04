import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';

export async function getCurrentBusiness(businessId: string) {
  const b = await prisma.business.findUnique({ where: { id: businessId } });
  if (!b) throw Errors.notFound('Business not found');
  return b;
}

export async function updateBusiness(businessId: string, data: any) {
  return prisma.business.update({ where: { id: businessId }, data });
}

export async function getBusinessHours(businessId: string) {
  return prisma.workingHours.findMany({
    where: { businessId, staffId: null },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function setBusinessHours(businessId: string, hours: any[]) {
  return prisma.$transaction(async (tx) => {
    await tx.workingHours.deleteMany({ where: { businessId, staffId: null } });
    if (hours.length) {
      await tx.workingHours.createMany({
        data: hours.map((h) => ({
          businessId,
          staffId: null,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          breaks: h.breaks ?? null,
        })),
      });
    }
    return tx.workingHours.findMany({
      where: { businessId, staffId: null },
      orderBy: { dayOfWeek: 'asc' },
    });
  });
}
