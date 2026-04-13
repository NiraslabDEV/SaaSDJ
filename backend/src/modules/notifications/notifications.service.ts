import { prisma } from '../../lib/prisma/client';

export async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { sentAt: 'desc' },
    take: 30,
    include: {
      booking: { select: { id: true, eventDate: true, locationAddress: true } },
    },
  });
}

export async function markRead(notificationId: string, userId: string) {
  const notif = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notif) throw Object.assign(new Error('Notificação não encontrada.'), { statusCode: 404, code: 'NOT_FOUND' });
  return prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
