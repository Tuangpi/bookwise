import { prisma } from '../../shared/db';
import { Errors } from '../../shared/errors';

export async function listCustomers(businessId: string) {
  return prisma.customer.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createCustomer(businessId: string, data: {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}) {
  return prisma.customer.create({
    data: {
      businessId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      tags: data.tags ?? [],
    },
  });
}

export async function updateCustomer(businessId: string, id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}) {
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) throw Errors.notFound('Customer not found');

  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      notes: data.notes ?? existing.notes,
      tags: data.tags ?? existing.tags,
    },
  });
}

export async function deleteCustomer(businessId: string, id: string) {
  const existing = await prisma.customer.findFirst({ where: { id, businessId } });
  if (!existing) throw Errors.notFound('Customer not found');

  await prisma.customer.delete({ where: { id } });
  return { ok: true };
}