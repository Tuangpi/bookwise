import { Response, NextFunction } from "express";
import { AuthRequest } from '../../shared/middleware/auth';
import * as svc from './business.service';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const b = await svc.getCurrentBusiness(req.businessId!);
    res.json({ success: true, data: b });
  } catch (e) { next(e); }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const b = await svc.updateBusiness(req.businessId!, body);
    res.json({ success: true, data: b });
  } catch (e) { next(e); }
}
