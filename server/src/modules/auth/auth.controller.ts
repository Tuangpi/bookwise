import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import * as service from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const result = await service.registerOwner(body);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const result = await service.login(body.email, body.password);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const result = await service.refresh(body.refreshToken);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    await service.logout(body.refreshToken);
    res.json({ success: true, data: { ok: true } });
  } catch (e) {
    next(e);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (e) {
    next(e);
  }
}
