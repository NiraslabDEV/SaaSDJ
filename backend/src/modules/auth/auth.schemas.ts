import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido.').max(255),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos 1 letra maiúscula.')
    .regex(/[0-9]/, 'Senha deve ter pelo menos 1 número.'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres.').max(100),
  role: z.enum(['ARTIST', 'CLIENT']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
