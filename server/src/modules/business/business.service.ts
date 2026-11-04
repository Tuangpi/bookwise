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
