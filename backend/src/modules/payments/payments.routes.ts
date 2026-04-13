import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import { AuthRequest } from '../../middlewares/authenticate';
import { getEarnings } from './payments.service';
import { Response, NextFunction } from 'express';

const router = Router();

router.get('/earnings', authenticate, requireRole('ARTIST'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getEarnings(req.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
