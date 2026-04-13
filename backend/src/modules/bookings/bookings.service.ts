import { prisma } from '../../lib/prisma/client';
import { sendEmail, emailTemplates } from '../../lib/email';
import {
  calculateLogisticsFee,
  calculateTotal,
  geocodeAddress,
  BASE_FEE,
  HOURLY_RATE,
} from '../logistics/logistics.service';
import type {
  CreateBookingInput,
  UpdateBookingStatusInput,
  CounterProposalInput,
} from './bookings.schemas';

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600000);
}

export async function createBooking(clientId: string, input: CreateBookingInput) {
  const eventDate = new Date(input.eventDate);

  if (eventDate <= new Date()) {
    throw Object.assign(new Error('A data do evento deve ser futura.'), { statusCode: 400, code: 'PAST_DATE' });
  }

  const artist = await prisma.user.findFirst({ where: { id: input.artistId, role: 'ARTIST' } });
  if (!artist) {
    throw Object.assign(new Error('Artista não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const conflict = await prisma.availabilitySlot.findFirst({
    where: {
      artistId: input.artistId,
      type: { in: ['BOOKED', 'BUFFER_BEFORE', 'BUFFER_AFTER', 'MANUAL_BLOCK'] },
      startTime: { lte: addHours(eventDate, input.durationHours) },
      endTime: { gte: eventDate },
    },
  });
  if (conflict) {
    throw Object.assign(
      new Error('Artista já possui um compromisso neste horário.'),
      { statusCode: 409, code: 'SLOT_CONFLICT' },
    );
  }

  const coords = await geocodeAddress(input.locationAddress);
  const logisticsFee = calculateLogisticsFee(artist.baseLat, artist.baseLng, coords?.lat ?? null, coords?.lng ?? null);
  const totalAmount = calculateTotal(input.durationHours, logisticsFee);

  const client = await prisma.user.findUnique({ where: { id: clientId }, select: { name: true, email: true } });

  const booking = await prisma.booking.create({
    data: {
      artistId: input.artistId,
      clientId,
      eventDate,
      durationHours: input.durationHours,
      locationAddress: input.locationAddress,
      locationLat: coords?.lat,
      locationLng: coords?.lng,
      baseFee: BASE_FEE,
      hourlyRate: HOURLY_RATE,
      logisticsFee,
      totalAmount,
    },
  });

  await prisma.notification.create({
    data: { userId: input.artistId, bookingId: booking.id, type: 'NEW_PROPOSAL' },
  });

  const tmpl = emailTemplates.newProposal(
    artist.name,
    client?.name ?? 'Cliente',
    eventDate.toLocaleDateString('pt-BR'),
    totalAmount,
  );
  sendEmail({ to: artist.email, ...tmpl }).catch(console.error);

  return booking;
}

export async function listBookings(
  userId: string,
  role: string,
  filters: { role?: string; status?: string },
) {
  const where: Record<string, unknown> = {};
  if (filters.role === 'artist' || role === 'ARTIST') {
    where.artistId = userId;
  } else {
    where.clientId = userId;
  }
  if (filters.status) {
    where.status = { in: filters.status.split(',') };
  }

  return prisma.booking.findMany({
    where,
    orderBy: { eventDate: 'asc' },
    include: {
      artist: { select: { id: true, name: true, profilePicture: true } },
      client: { select: { id: true, name: true } },
    },
  });
}

export async function getBookingById(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      artist: { select: { id: true, name: true, email: true, profilePicture: true, genres: true } },
      client: { select: { id: true, name: true, email: true } },
    },
  });

  if (!booking) {
    throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (booking.artistId !== userId && booking.clientId !== userId) {
    throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });
  }
  return booking;
}

export async function updateBookingStatus(
  bookingId: string,
  artistId: string,
  input: UpdateBookingStatusInput,
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (booking.artistId !== artistId) throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });
  if (booking.status !== 'PENDING' && booking.status !== 'COUNTER_PROPOSAL') {
    throw Object.assign(new Error('Proposta não pode ser alterada neste status.'), { statusCode: 400, code: 'INVALID_STATUS' });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: input.status },
    include: { artist: { select: { name: true } }, client: { select: { name: true, email: true } } },
  });

  if (input.status === 'APPROVED') {
    await createAvailabilitySlots(booking.artistId, booking.eventDate, booking.durationHours);
    await prisma.notification.create({ data: { userId: booking.clientId, bookingId, type: 'PROPOSAL_ACCEPTED' } });
    const tmpl = emailTemplates.proposalAccepted(
      updated.client.name,
      updated.artist.name,
      booking.eventDate.toLocaleDateString('pt-BR'),
    );
    sendEmail({ to: updated.client.email, ...tmpl }).catch(console.error);
  } else {
    await prisma.notification.create({ data: { userId: booking.clientId, bookingId, type: 'PROPOSAL_REJECTED' } });
    const tmpl = emailTemplates.proposalRejected(updated.client.name, updated.artist.name);
    sendEmail({ to: updated.client.email, ...tmpl }).catch(console.error);
  }

  return updated;
}

export async function sendCounterProposal(
  bookingId: string,
  artistId: string,
  input: CounterProposalInput,
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking não encontrado.'), { statusCode: 404, code: 'NOT_FOUND' });
  if (booking.artistId !== artistId) throw Object.assign(new Error('Acesso proibido.'), { statusCode: 403, code: 'FORBIDDEN' });

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COUNTER_PROPOSAL', counterOffer: input },
    include: { artist: { select: { name: true } }, client: { select: { name: true, email: true } } },
  });

  await prisma.notification.create({ data: { userId: booking.clientId, bookingId, type: 'COUNTER_PROPOSAL_RECEIVED' } });
  const tmpl = emailTemplates.counterProposal(updated.client.name, updated.artist.name, input.totalAmount);
  sendEmail({ to: updated.client.email, ...tmpl }).catch(console.error);

  return updated;
}

async function createAvailabilitySlots(artistId: string, eventDate: Date, durationHours: number) {
  const eventEnd = addHours(eventDate, durationHours);
  const bufferBefore = addHours(eventDate, -6);
  const bufferAfter = addHours(eventEnd, 4);

  await prisma.availabilitySlot.createMany({
    data: [
      { artistId, startTime: bufferBefore, endTime: eventDate, type: 'BUFFER_BEFORE' },
      { artistId, startTime: eventDate, endTime: eventEnd, type: 'BOOKED' },
      { artistId, startTime: eventEnd, endTime: bufferAfter, type: 'BUFFER_AFTER' },
    ],
    skipDuplicates: true,
  });
}
