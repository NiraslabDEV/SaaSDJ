import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as calendarService from './calendar.service';

export function syncGoogle(req: AuthRequest, res: Response) {
  const url = calendarService.getAuthUrl(req.user!.id);
  res.json({ url });
}

export async function googleCallback(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code, state: userId } = req.query as { code: string; state: string };
    await calendarService.handleGoogleCallback(code, userId);
    res.redirect('/dashboard.html?google=connected');
  } catch (err) {
    next(err);
  }
}

export async function getEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const googleEvents = await calendarService.getGoogleEvents(req.user!.id);
    res.json({ googleEvents });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to, artistId } = req.query as { from: string; to: string; artistId?: string };
    const id = artistId ?? req.user!.id;
    const slots = await calendarService.getAvailability(id, from, to);
    res.json(slots);
  } catch (err) {
    next(err);
  }
}

export async function addBlock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startTime, endTime } = req.body as { startTime: string; endTime: string };
    const slot = await calendarService.addManualBlock(req.user!.id, startTime, endTime);
    res.status(201).json(slot);
  } catch (err) {
    next(err);
  }
}
