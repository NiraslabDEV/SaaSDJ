import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import * as ctrl from './calendar.controller';

const router = Router();

router.get('/google/auth', authenticate, ctrl.syncGoogle);
router.get('/google/callback', ctrl.googleCallback);
router.get('/events', authenticate, ctrl.getEvents);
router.get('/availability', authenticate, ctrl.getAvailability);
router.post('/blocks', authenticate, requireRole('ARTIST'), ctrl.addBlock);

export default router;
