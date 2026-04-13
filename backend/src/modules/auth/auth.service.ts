import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma/client';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/jwt';
import type { RegisterInput, LoginInput } from './auth.schemas';

const BCRYPT_ROUNDS = 12;
const GENERIC_AUTH_ERROR = 'E-mail ou senha incorretos.';

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw Object.assign(new Error('E-mail já está em uso.'), { statusCode: 409, code: 'EMAIL_IN_USE' });
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);
  return { user, accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const dummyHash = '$2b$12$invalidhashfortimingequalisation000000000000000000000';
  const hash = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(input.password, hash);

  if (!user || !valid) {
    throw Object.assign(new Error(GENERIC_AUTH_ERROR), { statusCode: 401, code: 'INVALID_CREDENTIALS' });
  }

  const { accessToken, refreshToken } = await createTokenPair(user.id, user.role);
  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  return { user: safeUser, accessToken, refreshToken };
}

export async function refreshTokens(token: string) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw Object.assign(new Error('Sessão inválida. Faça login novamente.'), {
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Sessão inválida. Faça login novamente.'), {
      statusCode: 401,
      code: 'INVALID_REFRESH_TOKEN',
    });
  }

  await prisma.refreshToken.delete({ where: { token } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw Object.assign(new Error('Usuário não encontrado.'), { statusCode: 401, code: 'USER_NOT_FOUND' });
  }

  return createTokenPair(user.id, user.role);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

async function createTokenPair(userId: string, role: string) {
  const tokenRecord = await prisma.refreshToken.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt: addDays(7),
    },
  });

  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, tokenId: tokenRecord.id });

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { token: refreshToken },
  });

  return { accessToken, refreshToken };
}
