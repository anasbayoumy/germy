import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  USER_SERVICE_URL: z.string().url().default('http://user-service:3002'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('14'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
