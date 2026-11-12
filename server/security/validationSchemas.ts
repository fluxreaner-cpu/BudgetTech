import { z } from 'zod';

// Strict input sanitization against XSS & control characters
export function sanitizeText(val: string, maxLen = 100): string {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/[<>'"&`]/g, '') // strip HTML injection characters
    .replace(/[\x00-\x1F\x7F]/g, '') // strip ASCII control characters
    .slice(0, maxLen);
}

// 1. Send Verification Code Schema
export const SendCodeSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не должно превышать 50 символов')
    .transform((val) => sanitizeText(val, 50)),
  email: z
    .string()
    .email('Некорректный адрес электронной почты')
    .max(254, 'Email слишком длинный')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .max(128, 'Пароль не должен превышать 128 символов'),
});

// 2. Verify Code Schema
export const VerifyCodeSchema = z.object({
  email: z
    .string()
    .email('Некорректный email')
    .max(254)
    .transform((val) => val.trim().toLowerCase()),
  code: z
    .string()
    .regex(/^\d{6}$/, 'Код подтверждения должен состоять строго из 6 цифр'),
});

// 3. Login Schema
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Некорректный email')
    .max(254)
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Пароль обязателен для ввода')
    .max(128),
});

// 4. Saved Rig Item Schema (Anti-IDOR & Payload injection)
export const SavedRigItemSchema = z.object({
  id: z.string().max(80),
  name: z.string().max(150),
  category: z.string().max(40),
  price: z.number().nonnegative(),
  currency: z.string().max(10).optional(),
  store: z.string().max(60).optional(),
  imageUrl: z.string().max(300).optional(),
});

export const SaveRigsBodySchema = z.object({
  savedBuilds: z.array(SavedRigItemSchema).max(100, 'Максимум 100 сохраненных сборок'),
});

// 5. Catalog Query Pagination Schema (Anti-Scraping)
export const CatalogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24), // Strict max 50 items per query
  category: z.string().max(40).optional().default('all'),
  brand: z.string().max(50).optional().default('all'),
  search: z.string().max(100).optional().default(''),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});
