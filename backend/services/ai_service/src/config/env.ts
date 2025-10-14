import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

// Environment validation schema
const envSchema = z.object({
  // Service Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3004'),
  SERVICE_NAME: z.string().default('ai-service'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // AI Services Configuration
  ARCFACE_ENABLED: z.string().transform(val => val === 'true').default('true'),
  ARCFACE_MODEL_PATH: z.string().default('./models/arcface'),
  ARCFACE_THRESHOLD: z.string().transform(Number).default('70'),
  
  FRAUD_DETECTION_ENABLED: z.string().transform(val => val === 'true').default('true'),
  RISK_THRESHOLD_HIGH: z.string().transform(Number).default('80'),
  RISK_THRESHOLD_MEDIUM: z.string().transform(Number).default('60'),
  RISK_THRESHOLD_LOW: z.string().transform(Number).default('40'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-pro'),
  GEMINI_MAX_TOKENS: z.string().transform(Number).default('1000'),

  // ML Analytics (Post-MVP)
  ML_ANALYTICS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  ML_MODEL_PATH: z.string().default('./models/ml'),
  ML_PREDICTION_THRESHOLD: z.string().transform(Number).default('0.8'),

  // Performance Settings
  MAX_BATCH_SIZE: z.string().transform(Number).default('10'),
  PROCESSING_TIMEOUT: z.string().transform(Number).default('30000'),
  CACHE_TTL: z.string().transform(Number).default('3600'),
  MAX_CONCURRENT_REQUESTS: z.string().transform(Number).default('5'),

  // File Storage
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().default('ai-service-files'),
  AWS_REGION: z.string().default('us-east-1'),

  // Redis (for caching)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW: z.string().transform(Number).default('15'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  PROMETHEUS_PORT: z.string().transform(Number).default('9091'),

  // External Services
  AUTH_SERVICE_URL: z.string().default('http://auth-service:3001'),
  USER_SERVICE_URL: z.string().default('http://user-service:3002'),
  ATTENDANCE_SERVICE_URL: z.string().default('http://attendance-service:3003'),
});

// Validate environment variables
const env = envSchema.parse(process.env);

// Type-safe environment object
export type Env = z.infer<typeof envSchema>;

export { env };

// Helper functions for environment validation
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// AI Service specific helpers
export const isArcFaceEnabled = env.ARCFACE_ENABLED;
export const isFraudDetectionEnabled = env.FRAUD_DETECTION_ENABLED;
export const isGeminiEnabled = !!env.GEMINI_API_KEY;
export const isMLAnalyticsEnabled = env.ML_ANALYTICS_ENABLED;

// Performance helpers
export const getMaxBatchSize = () => env.MAX_BATCH_SIZE;
export const getProcessingTimeout = () => env.PROCESSING_TIMEOUT;
export const getCacheTTL = () => env.CACHE_TTL;
export const getMaxConcurrentRequests = () => env.MAX_CONCURRENT_REQUESTS;

// AI Service configuration
export const getArcFaceConfig = () => ({
  enabled: env.ARCFACE_ENABLED,
  modelPath: env.ARCFACE_MODEL_PATH,
  threshold: env.ARCFACE_THRESHOLD,
});

export const getFraudDetectionConfig = () => ({
  enabled: env.FRAUD_DETECTION_ENABLED,
  thresholds: {
    high: env.RISK_THRESHOLD_HIGH,
    medium: env.RISK_THRESHOLD_MEDIUM,
    low: env.RISK_THRESHOLD_LOW,
  },
});

export const getGeminiConfig = () => ({
  enabled: !!env.GEMINI_API_KEY,
  apiKey: env.GEMINI_API_KEY,
  model: env.GEMINI_MODEL,
  maxTokens: env.GEMINI_MAX_TOKENS,
});

export const getMLConfig = () => ({
  enabled: env.ML_ANALYTICS_ENABLED,
  modelPath: env.ML_MODEL_PATH,
  predictionThreshold: env.ML_PREDICTION_THRESHOLD,
});
