import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { AuthRequest } from '../../middlewares/authenticate';
import * as service from './notifications.service';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    res.json(await service.getNotifications(authReq.user!.id));
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    res.json(await service.markRead(req.params.id, authReq.user!.id));
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
});

router.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    await service.markAllRead(authReq.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
