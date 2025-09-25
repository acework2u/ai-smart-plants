import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().min(5),
  password: z.string().min(8).max(64),
  role: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
