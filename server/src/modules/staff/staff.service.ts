import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';

export async function listStaff(businessId: string) {
  return prisma.staff.findMany({
    where: { businessId },
    include: { services: { include: { service: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createStaff(businessId: string, data: any) {
  const { serviceIds, ...rest } = data;
  return prisma.staff.create({
    data: {
      businessId,
      name: rest.name,
      email: rest.email,
      phone: rest.phone,
      bio: rest.bio,
      active: rest.active ?? true,
      services: serviceIds ? { create: serviceIds.map((sid: string) => ({ serviceId: sid })) } : undefined,
    },
    include: { services: true },
  });
}

export async function updateStaff(businessId: string, id: string, data: any) {
  const s = await prisma.staff.findFirst({ where: { id, businessId } });
  if (!s) throw Errors.notFound('Staff not found');
  const { serviceIds, ...rest } = data;
  // replace service links if provided
  if (serviceIds) {
    await prisma.staffService.deleteMany({ where: { staffId: id } });
    if (serviceIds.length) {
      await prisma.staffService.createMany({ data: serviceIds.map((sid: string) => ({ staffId: id, serviceId: sid })) });
    }
  }
  return prisma.staff.update({ where: { id }, data: rest, include: { services: true } });
}

export async function deleteStaff(businessId: string, id: string) {
  const s = await prisma.staff.findFirst({ where: { id, businessId } });
  if (!s) throw Errors.notFound('Staff not found');
  await prisma.staff.delete({ where: { id } });
}

export async function getStaffHours(businessId: string, staffId: string) {
  const s = await prisma.staff.findFirst({ where: { id: staffId, businessId } });
  if (!s) throw Errors.notFound('Staff not found');
  return prisma.workingHours.findMany({
    where: { businessId, staffId },
    orderBy: { dayOfWeek: 'asc' },
  });
}

export async function setStaffHours(businessId: string, staffId: string, hours: any[]) {
  const s = await prisma.staff.findFirst({ where: { id: staffId, businessId } });
  if (!s) throw Errors.notFound('Staff not found');
  return prisma.$transaction(async (tx) => {
    await tx.workingHours.deleteMany({ where: { businessId, staffId } });
    if (hours.length) {
      await tx.workingHours.createMany({
        data: hours.map((h) => ({
          businessId,
          staffId,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime,
          endTime: h.endTime,
          breaks: h.breaks ?? null,
        })),
      });
    }
    return tx.workingHours.findMany({
      where: { businessId, staffId },
      orderBy: { dayOfWeek: 'asc' },
    });
  });
}
