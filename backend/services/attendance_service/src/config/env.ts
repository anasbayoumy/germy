import { config } from 'dotenv';

// Load environment variables
config();

export const env = {
  // Server configuration
  PORT: parseInt(process.env['PORT'] || '3002', 10),
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  
  // Database configuration
  DATABASE_URL: process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/germy_db',
  
  // JWT configuration
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-at-least-32-characters-long',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '24h',
  
  // CORS configuration
  CORS_ORIGINS: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  FRONTEND_URL: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  
  // Rate limiting
  RATE_LIMIT_WINDOW: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15', 10), // minutes
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
  
  // Service URLs
  AUTH_SERVICE_URL: process.env['AUTH_SERVICE_URL'] || 'http://auth-service:3001',
  USER_SERVICE_URL: process.env['USER_SERVICE_URL'] || 'http://user-service:3003',
  AI_SERVICE_URL: process.env['AI_SERVICE_URL'] || 'http://ai-service:3004',
  
  // AI Service configuration
  GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
  ARCFACE_ENABLED: process.env['ARCFACE_ENABLED'] === 'true',
  FRAUD_DETECTION_ENABLED: process.env['FRAUD_DETECTION_ENABLED'] === 'true',
  
  // File upload configuration
  MAX_FILE_SIZE: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: process.env['ALLOWED_FILE_TYPES']?.split(',') || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // Redis configuration (if using Redis for caching)
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
  
  // AWS S3 configuration (if using S3 for file storage)
  AWS_ACCESS_KEY_ID: process.env['AWS_ACCESS_KEY_ID'],
  AWS_SECRET_ACCESS_KEY: process.env['AWS_SECRET_ACCESS_KEY'],
  AWS_REGION: process.env['AWS_REGION'] || 'us-east-1',
  AWS_S3_BUCKET: process.env['AWS_S3_BUCKET'],
  
  // Logging configuration
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info',
  LOG_FILE: process.env['LOG_FILE'] || 'logs/attendance-service.log',
  
  // Security configuration
  BCRYPT_ROUNDS: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
  
  // Feature flags
  ENABLE_ANALYTICS: process.env['ENABLE_ANALYTICS'] === 'true',
  ENABLE_FRAUD_DETECTION: process.env['ENABLE_FRAUD_DETECTION'] === 'true',
  ENABLE_REAL_TIME_MONITORING: process.env['ENABLE_REAL_TIME_MONITORING'] === 'true',
  
  // Timezone configuration
  DEFAULT_TIMEZONE: process.env['DEFAULT_TIMEZONE'] || 'UTC',
  
  // Notification configuration
  ENABLE_NOTIFICATIONS: process.env['ENABLE_NOTIFICATIONS'] === 'true',
  NOTIFICATION_SERVICE_URL: process.env['NOTIFICATION_SERVICE_URL'] || 'http://notification-service:3005',
  
  // Monitoring and metrics
  ENABLE_METRICS: process.env['ENABLE_METRICS'] === 'true',
  METRICS_PORT: parseInt(process.env['METRICS_PORT'] || '9090', 10),
  
  // Health check configuration
  HEALTH_CHECK_INTERVAL: parseInt(process.env['HEALTH_CHECK_INTERVAL'] || '30000', 10), // 30 seconds
  HEALTH_CHECK_TIMEOUT: parseInt(process.env['HEALTH_CHECK_TIMEOUT'] || '5000', 10), // 5 seconds
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export default env;