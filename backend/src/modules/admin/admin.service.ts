import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma/client';

export async function getDashboardStats() {
  const [
    totalUsers,
    totalArtists,
    totalClients,
    totalBookings,
    totalRevenue,
    pendingBookings,
    paidPayments,
    recentBookings,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ARTIST' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.booking.count(),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'PAID' } }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        artist: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
      },
    }),
    getMonthlyRevenue(),
  ]);

  return {
    users: { total: totalUsers, artists: totalArtists, clients: totalClients },
    bookings: { total: totalBookings, pending: pendingBookings },
    revenue: { total: totalRevenue._sum.amount ?? 0, paidPayments },
    recentBookings,
    monthlyRevenue,
  };
}

async function getMonthlyRevenue() {
  const now = new Date();
  const months: Array<{ month: string; revenue: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const result = await prisma.payment.aggregate({
      where: { status: 'PAID', paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    months.push({
      month: start.toLocaleDateString('pt-BR', { month: 'short' }),
      revenue: result._sum.amount ?? 0,
    });
  }

  return months;
}

export async function listAllUsers(page = 1, limit = 20, role?: string) {
  const skip = (page - 1) * limit;
  const where: Prisma.UserWhereInput = role ? { role: role as any } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
        _count: { select: { artistBookings: true, clientBookings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pages: Math.ceil(total / limit) };
}

export async function listAllBookings(page = 1, limit = 20, status?: string) {
  const skip = (page - 1) * limit;
  const where = status ? { status: status as any } : {};

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        artist: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
        payment: { select: { status: true, amount: true, method: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, pages: Math.ceil(total / limit) };
}

export async function listAllPayments(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          select: {
            eventDate: true,
            locationAddress: true,
            artist: { select: { name: true } },
            client: { select: { name: true } },
          },
        },
      },
    }),
    prisma.payment.count(),
  ]);

  return { payments, total, page, pages: Math.ceil(total / limit) };
}

export async function updateUserRole(userId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });

  return prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });
}

export async function toggleUserActive(userId: string) {
  // For future: add isActive field to User model
  // For now, just return the user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  return user;
}