import { prisma } from '../../shared/db';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { Errors } from '../../shared/errors';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';

interface RegisterInput {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  timezone?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function registerOwner(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw Errors.conflict('Email already registered');

  const passwordHash = await hashPassword(input.password);

  // unique slug
  let slug = slugify(input.businessName);
  const taken = await prisma.business.findUnique({ where: { slug } });
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.ownerName,
        phone: input.phone,
        role: Role.BUSINESS_OWNER,
      },
    });
    const business = await tx.business.create({
      data: {
        name: input.businessName,
        slug,
        timezone: input.timezone ?? 'UTC',
        ownerId: user.id,
      },
    });
    await tx.businessMember.create({
      data: { userId: user.id, businessId: business.id, role: Role.BUSINESS_OWNER },
    });
    // seed FREE plan? ensure Plan exists; skip for now
    return { user, business };
  });

  const jti = randomUUID();
  const accessToken = signAccessToken({
    sub: result.user.id,
    role: result.user.role,
    businessId: result.business.id,
  });
  const refreshToken = signRefreshToken(result.user.id, jti);
  await prisma.refreshToken.create({
    data: { userId: result.user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  return {
    user: { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role },
    business: { id: result.business.id, name: result.business.name, slug: result.business.slug },
    accessToken,
    refreshToken,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw Errors.unauthorized('Invalid credentials');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Errors.unauthorized('Invalid credentials');

  // resolve primary business
  const membership = await prisma.businessMember.findFirst({ where: { userId: user.id } });
  const businessId = membership?.businessId;

  const jti = randomUUID();
  const accessToken = signAccessToken({ sub: user.id, role: user.role, businessId });
  const refreshToken = signRefreshToken(user.id, jti);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    businessId,
    accessToken,
    refreshToken,
  };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Errors.unauthorized('Invalid refresh token');
  }
  if (payload.type !== 'refresh') throw Errors.unauthorized();

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw Errors.unauthorized('Refresh token revoked or expired');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Errors.unauthorized();

  const membership = await prisma.businessMember.findFirst({ where: { userId: user.id } });
  const businessId = membership?.businessId;

  // rotate
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const jti = randomUUID();
  const newAccess = signAccessToken({ sub: user.id, role: user.role, businessId });
  const newRefresh = signRefreshToken(user.id, jti);
  await prisma.refreshToken.create({
    data: { userId: user.id, token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  return { accessToken: newAccess, refreshToken: newRefresh };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revoked: true } });
}
