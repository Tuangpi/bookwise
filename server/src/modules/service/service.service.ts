import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';

export async function listServices(businessId: string) {
  return prisma.service.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' } });
}

export async function createService(businessId: string, data: any) {
  return prisma.service.create({
    data: {
      businessId,
      name: data.name,
      description: data.description,
      durationMin: data.durationMin,
      price: data.price,
      categoryId: data.categoryId,
      active: data.active ?? true,
    },
  });
}

export async function updateService(businessId: string, id: string, data: any) {
  const s = await prisma.service.findFirst({ where: { id, businessId } });
  if (!s) throw Errors.notFound('Service not found');
  return prisma.service.update({ where: { id }, data });
}

export async function deleteService(businessId: string, id: string) {
  const s = await prisma.service.findFirst({ where: { id, businessId } });
  if (!s) throw Errors.notFound('Service not found');
  await prisma.service.delete({ where: { id } });
}
