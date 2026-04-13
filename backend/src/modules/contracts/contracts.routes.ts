import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { AuthRequest } from '../../middlewares/authenticate';
import { generateContract } from './contracts.service';

const router = Router();

router.post('/:bookingId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const url = await generateContract(req.params.bookingId, authReq.user!.id);
    res.json({ contractPdfUrl: url });
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
});

export default router;
