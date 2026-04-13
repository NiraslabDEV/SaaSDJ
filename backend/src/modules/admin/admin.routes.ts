import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import * as ctrl from './admin.controller';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.listUsers);
router.patch('/users/:userId/role', ctrl.changeUserRole);
router.get('/bookings', ctrl.listBookings);
router.get('/payments', ctrl.listPayments);

export default router;