import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:3000'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  ENCRYPTION_KEY: z.string().length(32).default('32_characters_secret_key_1234567'), // 32 bytes for AES-256
  REDIS_URL: z.string().url().optional(),
});


export const env = envSchema.parse(process.env);
