import { prisma } from '../../shared/db';
import { AuthRequest } from '../../shared/middleware/auth';
import { Errors } from '../../shared/errors';

export async function listBusinesses(req: AuthRequest, res: any, next: any) {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { bookings: true, staff: true, customers: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBusiness(req: AuthRequest, res: any, next: any) {
  try {
    const { businessId } = req.params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: { bookings: true, staff: true, customers: true },
        },
      },
    });

    if (!business) {
      throw new Errors.notFound('Business not found');
    }

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBusiness(req: AuthRequest, res: any, next: any) {
  try {
    const { businessId } = req.params;
    const { body } = (req as any).validated ?? { body: req.body };

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: body.name,
        slug: body.slug,
        timezone: body.timezone,
        currency: body.currency,
        phone: body.phone,
        email: body.email,
        address: body.address,
        logoUrl: body.logoUrl,
      },
    });

    res.json({
      success: true,
      data: business,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBusiness(req: AuthRequest, res: any, next: any) {
  try {
    const { businessId } = req.params;

    await prisma.business.delete({
      where: { id: businessId },
    });

    res.json({
      success: true,
      data: { id: businessId },
    });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req: AuthRequest, res: any, next: any) {
  try {
    const { businessId } = req.params || {};

    const where = businessId ? { businessId } : {};

    const users = await prisma.businessMember.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req: AuthRequest, res: any, next: any) {
  try {
    const { userId } = req.params;
    const { role } = (req as any).validated ?? { role: req.body.role };

    const membership = await prisma.businessMember.update({
      where: { userId },
      data: { role },
    });

    res.json({
      success: true,
      data: membership,
    });
  } catch (error) {
    next(error);
  }
}