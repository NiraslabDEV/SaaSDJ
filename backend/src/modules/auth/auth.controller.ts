import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json(tokens);
  } catch (err: any) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.code });
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.refreshToken as string | undefined;
    if (token) await authService.logout(token);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
