import { prisma } from '../../lib/prisma/client';

export async function getEarnings(artistId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [monthly, prevMonthly, upcoming] = await Promise.all([
    prisma.booking.aggregate({
      where: { artistId, status: 'APPROVED', eventDate: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { artistId, status: 'APPROVED', eventDate: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: { artistId, status: 'APPROVED', eventDate: { gte: now } },
      orderBy: { eventDate: 'asc' },
      take: 5,
      select: {
        id: true,
        eventDate: true,
        totalAmount: true,
        locationAddress: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  const monthlyTotal = monthly._sum.totalAmount ?? 0;
  const prevTotal = prevMonthly._sum.totalAmount ?? 0;
  const growth = prevTotal > 0 ? ((monthlyTotal - prevTotal) / prevTotal) * 100 : 0;

  return {
    monthly: monthlyTotal,
    previousMonth: prevTotal,
    growth: Math.round(growth * 10) / 10,
    upcoming: upcoming.map(b => ({
      bookingId: b.id,
      eventName: b.client.name,
      date: b.eventDate,
      amount: b.totalAmount,
      location: b.locationAddress,
    })),
  };
}
