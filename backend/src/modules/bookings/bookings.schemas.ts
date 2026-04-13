import { z } from 'zod';

export const createBookingSchema = z.object({
  artistId: z.string().cuid(),
  eventDate: z.string().datetime({ message: 'Data deve estar no formato ISO 8601.' }),
  durationHours: z.number().int().min(1).max(12),
  locationAddress: z.string().min(5).max(500),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const counterProposalSchema = z.object({
  totalAmount: z.number().positive(),
  durationHours: z.number().int().min(1).max(12).optional(),
  notes: z.string().max(1000).optional(),
});

export const acceptCounterSchema = z.object({
  accept: z.boolean(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CounterProposalInput = z.infer<typeof counterProposalSchema>;
