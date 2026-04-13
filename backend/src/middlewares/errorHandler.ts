import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  if (env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Erro interno do servidor.', code: 'INTERNAL_ERROR' });
  }

  return res.status(500).json({
    error: err.message,
    code: 'INTERNAL_ERROR',
    stack: err.stack,
  });
}
