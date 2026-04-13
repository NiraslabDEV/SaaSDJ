import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireRole } from '../../middlewares/authorize';
import * as ctrl from './payments.controller';

const router = Router();

// Stripe checkout session
router.post('/checkout', authenticate, ctrl.createPaymentSession);

// Stripe webhook (no auth - called by Stripe)
router.post('/webhook', ctrl.handleStripeWebhook);

// Get payment status for a booking
router.get('/booking/:bookingId', authenticate, ctrl.getPaymentStatus);

// List all payments for current user
router.get('/list', authenticate, ctrl.listPayments);

// Admin: mark payment as paid (manual/PIX)
router.post('/booking/:bookingId/confirm', authenticate, requireRole('ARTIST'), ctrl.markAsPaid);

// Admin: refund payment
router.post('/booking/:bookingId/refund', authenticate, requireRole('ARTIST'), ctrl.refundPayment);

// Artist earnings
router.get('/earnings', authenticate, requireRole('ARTIST'), ctrl.getEarningsHandler);

export default router;