import { Response, NextFunction } from "express";
import { AuthRequest } from '../../shared/middleware/auth';
import * as svc from './service.service';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await svc.listServices(req.businessId!);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body } = (req as any).validated ?? { body: req.body };
    const item = await svc.createService(req.businessId!, body);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { body, params } = (req as any).validated ?? { body: req.body, params: req.params };
    const item = await svc.updateService(req.businessId!, params.id, body);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    await svc.deleteService(req.businessId!, id);
    res.json({ success: true, data: { ok: true } });
  } catch (e) { next(e); }
}
