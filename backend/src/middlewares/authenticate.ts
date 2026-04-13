import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name: string;
  };
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.', code: 'MISSING_TOKEN' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, email: true, name: true },
    });
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token expirado.', code: 'TOKEN_EXPIRED' });
  }
}
