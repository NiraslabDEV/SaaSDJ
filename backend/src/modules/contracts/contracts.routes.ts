import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { AuthRequest } from '../../middlewares/authenticate';
import { generateContract } from './contracts.service';
import { Response, NextFunction } from 'express';

const router = Router();

router.post('/:bookingId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const url = await generateContract(req.params.bookingId, req.user!.id);
    res.json({ contractPdfUrl: url });
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
});

export default router;
