import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as paymentsService from './payments.service';

export async function createPaymentSession(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { bookingId } = req.body as { bookingId: string };
    const session = await paymentsService.createStripeCheckoutSession(bookingId, authReq.user!.id);
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function handleStripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['stripe-signature'] as string;
    await paymentsService.handleStripeWebhook(sig, req.body);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { bookingId } = req.params;
    const payment = await paymentsService.getPaymentByBooking(bookingId, authReq.user!.id);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const payments = await paymentsService.listUserPayments(authReq.user!.id);
    res.json(payments);
  } catch (err) {
    next(err);
  }
}

export async function markAsPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params;
    const { method } = req.body as { method?: string };
    const payment = await paymentsService.markPaymentAsPaid(bookingId, method);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function refundPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookingId } = req.params;
    const payment = await paymentsService.refundPayment(bookingId);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function getEarningsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const data = await paymentsService.getEarnings(authReq.user!.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}