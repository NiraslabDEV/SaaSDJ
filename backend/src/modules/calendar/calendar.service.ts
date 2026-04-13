import { google } from 'googleapis';
import { prisma } from '../../lib/prisma/client';
import { env } from '../../config/env';

function getOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(userId: string): string {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: userId,
    prompt: 'consent',
  });
}

export async function handleGoogleCallback(code: string, userId: string) {
  const oauth2 = getOAuthClient();
  const { tokens } = await oauth2.getToken(code);

  await prisma.googleToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: new Date(tokens.expiry_date!),
    },
    update: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: new Date(tokens.expiry_date!),
    },
  });
}

export async function getGoogleEvents(userId: string) {
  const tokenRecord = await prisma.googleToken.findUnique({ where: { userId } });
  if (!tokenRecord) return [];

  const oauth2 = getOAuthClient();
  oauth2.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken ?? undefined,
    expiry_date: tokenRecord.expiryDate.getTime(),
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  const now = new Date();
  const oneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: oneMonth.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });

  return response.data.items ?? [];
}

export async function getAvailability(artistId: string, from: string, to: string) {
  return prisma.availabilitySlot.findMany({
    where: {
      artistId,
      startTime: { gte: new Date(from) },
      endTime: { lte: new Date(to) },
    },
    orderBy: { startTime: 'asc' },
  });
}

export async function addManualBlock(artistId: string, startTime: string, endTime: string) {
  return prisma.availabilitySlot.create({
    data: {
      artistId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      type: 'MANUAL_BLOCK',
    },
  });
}
