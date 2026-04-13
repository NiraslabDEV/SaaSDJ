import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authenticate';
import * as usersService from './users.service';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const user = await usersService.getMe(authReq.user!.id);
    res.json(user);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthRequest;
    const user = await usersService.updateMe(authReq.user!.id, req.body);
    res.json(user);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function getArtist(req: Request, res: Response, next: NextFunction) {
  try {
    const artist = await usersService.getArtistById(req.params.id);
    res.json(artist);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function listArtists(_req: Request, res: Response, next: NextFunction) {
  try {
    const artists = await usersService.listArtists();
    res.json(artists);
  } catch (err) {
    next(err);
  }
}
