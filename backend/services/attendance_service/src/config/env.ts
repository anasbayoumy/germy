import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

const envSchema = z.object({
  // Service Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3003'),
  SERVICE_NAME: z.string().default('attendance-service'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // AI Integration
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  FACE_COMPARISON_THRESHOLD: z.string().transform(Number).default('70'),
  LIVENESS_THRESHOLD: z.string().transform(Number).default('80'),

  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // Geofence Settings
  DEFAULT_GEOFENCE_RADIUS: z.string().transform(Number).default('350'),
  GEOFENCE_BUFFER_ZONE: z.string().transform(Number).default('50'),
  LOCATION_ACCURACY_THRESHOLD: z.string().transform(Number).default('10'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).min(10).max(15).default('12'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  PROMETHEUS_PORT: z.string().transform(Number).default('9090'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // External Services
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  USER_SERVICE_URL: z.string().url().default('http://localhost:3002'),
  FILE_SERVICE_URL: z.string().url().default('http://localhost:3006'),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Upload Settings
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  UPLOAD_PATH: z.string().default('./uploads'),

  // AI Processing
  AI_PROCESSING_TIMEOUT: z.string().transform(Number).default('30000'),
  MAX_CONCURRENT_AI_REQUESTS: z.string().transform(Number).default('10'),

  // Fraud Detection
  FRAUD_DETECTION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RISK_SCORE_THRESHOLD: z.string().transform(Number).default('70'),
  AUTO_FLAG_THRESHOLD: z.string().transform(Number).default('85'),

  // Performance
  MAX_CONCURRENT_REQUESTS: z.string().transform(Number).default('100'),
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

export { env };
