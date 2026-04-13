import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import { AuthRequest } from '../../middlewares/authenticate';
import { getEarnings } from './payments.service';

const router = Router();

router.get('/earnings', authenticate, requireRole('ARTIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const data = await getEarnings(authReq.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
