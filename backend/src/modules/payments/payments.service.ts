import Stripe from 'stripe';
import { prisma } from '../../lib/prisma/client';
import { env } from '../../config/env';
import { sendEmail } from '../../lib/email';

type StripeClient = InstanceType<typeof Stripe>;

function getStripe(): StripeClient | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

const PLATFORM_FEE_PERCENT = env.STRIPE_PLATFORM_FEE_PERCENT;

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

export async function createStripeCheckoutSession(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { artist: true, client: true },
  });

  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (booking.clientId !== userId && booking.artistId !== userId) {
    throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });
  }
  if (booking.status !== 'APPROVED') {
    throw Object.assign(new Error('Booking não está aprovado.'), { statusCode: 400, code: 'BAD_REQUEST' });
  }

  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
  if (existingPayment && existingPayment.status === 'PAID') {
    throw Object.assign(new Error('Pagamento já realizado.'), { statusCode: 400, code: 'BAD_REQUEST' });
  }

  const platformFee = Math.round(booking.totalAmount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const artistPayout = booking.totalAmount - platformFee;

  const stripe = getStripe();
  if (!stripe) {
    // Mock mode: create payment record without Stripe
    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalAmount,
        platformFee,
        artistPayout,
        status: 'PENDING',
        method: 'STRIPE',
      },
      update: {
        amount: booking.totalAmount,
        platformFee,
        artistPayout,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: { userId: booking.artistId, bookingId, type: 'PAYMENT_PENDING' },
    });

    return { paymentId: payment.id, mockMode: true, url: null };
  }

  // Real Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Booking - ${booking.artist.name}`,
            description: `Evento em ${new Date(booking.eventDate).toLocaleDateString('pt-BR')} | ${booking.locationAddress}`,
          },
          unit_amount: Math.round(booking.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${env.FRONTEND_URL}/booking-details.html?bookingId=${bookingId}&payment=success`,
    cancel_url: `${env.FRONTEND_URL}/booking-details.html?bookingId=${bookingId}&payment=cancelled`,
    metadata: { bookingId, platformFee: platformFee.toString(), artistPayout: artistPayout.toString() },
  });

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      stripeSessionId: session.id,
      amount: booking.totalAmount,
      platformFee,
      artistPayout,
      status: 'PENDING',
      method: 'STRIPE',
    },
    update: {
      stripeSessionId: session.id,
      amount: booking.totalAmount,
      platformFee,
      artistPayout,
      status: 'PENDING',
    },
  });

  await prisma.notification.create({
    data: { userId: booking.artistId, bookingId, type: 'PAYMENT_PENDING' },
  });

  return { paymentId: payment.id, url: session.url };
}

export async function handleStripeWebhook(signature: string, rawBody: Buffer | string) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    console.log('[STRIPE MOCK] Webhook received but no Stripe config');
    return;
  }

  const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Record<string, any>;
      const bookingId = session.metadata?.bookingId as string | undefined;
      if (!bookingId) break;

      await prisma.payment.update({
        where: { bookingId },
        data: {
          stripePaymentId: session.payment_intent as string,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { artist: true, client: true },
      });

      if (booking) {
        await prisma.notification.create({
          data: { userId: booking.artistId, bookingId, type: 'PAYMENT_CONFIRMED' },
        });
        await prisma.notification.create({
          data: { userId: booking.clientId, bookingId, type: 'PAYMENT_CONFIRMED' },
        });

        await sendEmail({
          to: booking.artist.email,
          subject: 'Pagamento Confirmado! – Pulso Musical',
          html: `<div style="font-family:Inter,sans-serif;background:#0e0e0e;color:#fff;padding:32px;border-radius:16px;max-width:600px">
            <h1 style="color:#e6ff00;font-family:Manrope,sans-serif">Pagamento Confirmado!</h1>
            <p>Olá <strong>${booking.artist.name}</strong>,</p>
            <p>O pagamento de <strong>R$ ${booking.totalAmount.toFixed(2)}</strong> foi confirmado para o evento em ${new Date(booking.eventDate).toLocaleDateString('pt-BR')}.</p>
          </div>`,
        });
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Record<string, any>;
      const bookingId = session.metadata?.bookingId as string | undefined;
      if (!bookingId) break;

      await prisma.payment.update({
        where: { bookingId },
        data: { status: 'CANCELLED' },
      });

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (booking) {
        await prisma.notification.create({
          data: { userId: booking.clientId, bookingId, type: 'PAYMENT_FAILED' },
        });
      }
      break;
    }

    default:
      console.log(`[STRIPE] Unhandled event type: ${event.type}`);
  }
}

export async function getPaymentByBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (booking.artistId !== userId && booking.clientId !== userId) {
    throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });
  }

  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) return { status: 'NO_PAYMENT', bookingId };
  return payment;
}

export async function listUserPayments(userId: string) {
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ artistId: userId }, { clientId: userId }] },
    select: { id: true },
  });
  const bookingIds = bookings.map(b => b.id);

  return prisma.payment.findMany({
    where: { bookingId: { in: bookingIds } },
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
  });
}

export async function markPaymentAsPaid(bookingId: string, method?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });

  const platformFee = Math.round(booking.totalAmount * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  const artistPayout = booking.totalAmount - platformFee;

  const payment = await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.totalAmount,
      platformFee,
      artistPayout,
      status: 'PAID',
      method: (method as 'PIX' | 'MANUAL' | 'STRIPE') || 'MANUAL',
      paidAt: new Date(),
    },
    update: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: { userId: booking.artistId, bookingId, type: 'PAYMENT_CONFIRMED' },
  });
  await prisma.notification.create({
    data: { userId: booking.clientId, bookingId, type: 'PAYMENT_CONFIRMED' },
  });

  return payment;
}

export async function refundPayment(bookingId: string) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) throw Object.assign(new Error('Pagamento não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (payment.status !== 'PAID') throw Object.assign(new Error('Pagamento não está pago.'), { statusCode: 400, code: 'BAD_REQUEST' });

  const stripe = getStripe();
  if (stripe && payment.stripePaymentId) {
    try {
      await stripe.refunds.create({ payment_intent: payment.stripePaymentId });
    } catch (err) {
      console.error('[STRIPE] Refund failed:', err);
    }
  }

  const updated = await prisma.payment.update({
    where: { bookingId },
    data: { status: 'REFUNDED' },
  });

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking) {
    await prisma.notification.create({
      data: { userId: booking.artistId, bookingId, type: 'PAYMENT_FAILED' },
    });
    await prisma.notification.create({
      data: { userId: booking.clientId, bookingId, type: 'PAYMENT_FAILED' },
    });
  }

  return updated;
}