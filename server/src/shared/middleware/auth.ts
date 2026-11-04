import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { Errors } from '../errors';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; businessId?: string };
  businessId?: string;
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Missing bearer token'));
  }
  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw Errors.unauthorized();
    req.user = { id: payload.sub, role: payload.role, businessId: payload.businessId };
    req.businessId = payload.businessId;
    next();
  } catch {
    return next(Errors.unauthorized('Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
}

export function requireTenant(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.businessId && req.user?.role !== 'PLATFORM_ADMIN') {
    return next(Errors.forbidden('No business context'));
  }
  next();
}

export async function loadBusinessContext(_req: AuthRequest, _res: Response, next: NextFunction) {
  // For routes that need businessId from a param (e.g. public booking by slug), handled separately.
  next();
}
