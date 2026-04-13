import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  counterProposalSchema,
} from './bookings.schemas';
import * as ctrl from './bookings.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('CLIENT'), validate(createBookingSchema), ctrl.createBooking);
router.get('/', ctrl.listBookings);
router.get('/:id', ctrl.getBooking);
router.patch('/:id/status', requireRole('ARTIST'), validate(updateBookingStatusSchema), ctrl.updateStatus);
router.post('/:id/counter-proposal', requireRole('ARTIST'), validate(counterProposalSchema), ctrl.counterProposal);

export default router;
