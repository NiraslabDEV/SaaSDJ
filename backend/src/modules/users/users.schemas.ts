import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  genres: z.array(z.string()).optional(),
  yearsActive: z.number().int().min(0).max(100).optional(),
  profilePicture: z.string().url().optional(),
  baseAddress: z.string().max(300).optional(),
  baseLat: z.number().optional(),
  baseLng: z.number().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
