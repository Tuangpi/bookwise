import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import * as svc from './reports.service';

export async function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const result = await svc.getSummary(req.businessId!, { start, end });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function revenue(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const result = await svc.getRevenueOverTime(req.businessId!, { start, end });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function staff(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const result = await svc.getStaffUtilization(req.businessId!, { start, end });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function status(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const result = await svc.getStatusBreakdown(req.businessId!, { start, end });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}

export async function services(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { start, end } = (req as any).validated?.query ?? {};
    const result = await svc.getPopularServices(req.businessId!, { start, end });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}
