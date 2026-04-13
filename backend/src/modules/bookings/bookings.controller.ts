import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as bookingsService from './bookings.service';

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const booking = await bookingsService.createBooking(authReq.user!.id, req.body);
    res.status(201).json(booking);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function listBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const bookings = await bookingsService.listBookings(
      authReq.user!.id,
      authReq.user!.role,
      { role: req.query.role as string, status: req.query.status as string },
    );
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const booking = await bookingsService.getBookingById(req.params.id, authReq.user!.id);
    res.json(booking);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const booking = await bookingsService.updateBookingStatus(req.params.id, authReq.user!.id, req.body);
    res.json(booking);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function counterProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const booking = await bookingsService.sendCounterProposal(req.params.id, authReq.user!.id, req.body);
    res.json(booking);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}
