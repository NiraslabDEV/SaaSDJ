import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { AuthRequest } from '../../middlewares/authenticate';
import * as service from './notifications.service';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await service.getNotifications(req.user!.id));
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await service.markRead(req.params.id, req.user!.id));
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
});

router.post('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await service.markAllRead(req.user!.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
