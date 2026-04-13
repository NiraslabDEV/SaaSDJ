import { prisma } from '../../lib/prisma/client';
import type { UpdateUserInput } from './users.schemas';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  profilePicture: true,
  bio: true,
  genres: true,
  yearsActive: true,
  baseAddress: true,
  baseLat: true,
  baseLng: true,
  createdAt: true,
} as const;

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw Object.assign(new Error('Usuário não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  return user;
}

export async function updateMe(userId: string, data: UpdateUserInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: USER_SELECT,
  });
}

export async function getArtistById(artistId: string) {
  const user = await prisma.user.findFirst({
    where: { id: artistId, role: 'ARTIST' },
    select: { ...USER_SELECT, artistBookings: { select: { id: true }, where: { status: 'APPROVED' } } },
  });
  if (!user) throw Object.assign(new Error('Artista não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  return {
    ...user,
    totalBookings: user.artistBookings.length,
    artistBookings: undefined,
  };
}

export async function listArtists() {
  return prisma.user.findMany({
    where: { role: 'ARTIST' },
    select: USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });
}
