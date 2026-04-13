import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as adminService from './admin.service';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, role } = req.query as { page?: string; limit?: string; role?: string };
    const result = await adminService.listAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      role,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, status } = req.query as { page?: string; limit?: string; status?: string };
    const result = await adminService.listAllBookings(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await adminService.listAllPayments(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const { role } = req.body as { role: string };
    if (!['ARTIST', 'CLIENT', 'ADMIN'].includes(role)) {
      throw Object.assign(new Error('Role inválido.'), { statusCode: 400, code: 'BAD_REQUEST' });
    }
    const user = await adminService.updateUserRole(userId, role);
    res.json(user);
  } catch (err) {
    next(err);
  }
}