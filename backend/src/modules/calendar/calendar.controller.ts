import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as calendarService from './calendar.service';

export function syncGoogle(req: Request, res: Response) {
  const authReq = req as AuthRequest;
  const url = calendarService.getAuthUrl(authReq.user!.id);
  res.json({ url });
}

export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, state: userId } = req.query as { code: string; state: string };
    await calendarService.handleGoogleCallback(code, userId);
    res.redirect('/dashboard.html?google=connected');
  } catch (err) {
    next(err);
  }
}

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const googleEvents = await calendarService.getGoogleEvents(authReq.user!.id);
    res.json({ googleEvents });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { from, to, artistId } = req.query as { from: string; to: string; artistId?: string };
    const id = artistId ?? authReq.user!.id;
    const slots = await calendarService.getAvailability(id, from, to);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function addBlock(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const { startTime, endTime } = req.body as { startTime: string; endTime: string };
    const slot = await calendarService.addManualBlock(authReq.user!.id, startTime, endTime);
    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}
