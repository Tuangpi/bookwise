import { Response, NextFunction } from "express";
import { AuthRequest } from '../../shared/middleware/auth';
import * as svc from './notification.service';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const items = await svc.listNotifications(req.businessId!, status as string | undefined);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const item = await svc.createNotification(req.businessId!, body);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function markSent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const item = await svc.markAsSent(id);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
}
