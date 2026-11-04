import { Response, NextFunction } from "express";
import { AuthRequest } from '../../shared/middleware/auth';
import * as svc from './availability.service';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { query } = (req as any).validated ?? { query: req.query };
    const data = await svc.listAvailability(req.businessId!, query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
}
