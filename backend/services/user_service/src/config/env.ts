import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3003'),
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  AUTH_SERVICE_URL: z.string().url().default('http://auth-service:3001'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('14'),
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().default('5242880'), // 5MB
  
  // Redis Configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  
  // Security Configuration
  SECURITY_MAX_LOGIN_ATTEMPTS: z.string().transform(Number).default('5'),
  SECURITY_LOCKOUT_DURATION: z.string().transform(Number).default('15'),
  SECURITY_SESSION_TIMEOUT: z.string().transform(Number).default('480'),
  
  // Job Queue Configuration
  JOB_QUEUE_REDIS_URL: z.string().default('redis://localhost:6379'),
  JOB_QUEUE_CONCURRENCY: z.string().transform(Number).default('5'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;