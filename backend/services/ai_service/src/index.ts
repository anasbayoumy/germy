import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { config } from 'dotenv';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { handleUploadError } from './middleware/upload.middleware';
import { testConnection, closeConnection } from './config/database';

// Import routes
import aiRoutes from './routes/ai.routes';
import arcfaceRoutes from './routes/arcface.routes';
import fraudRoutes from './routes/fraud.routes';

// Load environment variables
config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000, // Convert minutes to milliseconds
  max: env.RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Compression and logging
app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Larger limit for AI processing
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await testConnection();
    
    res.status(200).json({
      success: true,
      message: 'AI Service is running',
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      version: '1.0.0',
      environment: env.NODE_ENV,
      database: dbHealth ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      aiServices: {
        arcface: env.ARCFACE_ENABLED ? 'enabled' : 'disabled',
        fraudDetection: env.FRAUD_DETECTION_ENABLED ? 'enabled' : 'disabled',
        geminiChat: env.GEMINI_API_KEY ? 'enabled' : 'disabled',
        mlAnalytics: env.ML_ANALYTICS_ENABLED ? 'enabled' : 'disabled',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// AI Service status endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Service Status',
    services: {
      arcface: {
        status: env.ARCFACE_ENABLED ? 'active' : 'inactive',
        version: '1.0.0',
        capabilities: ['face_encoding', 'face_comparison', 'quality_assessment'],
      },
      fraudDetection: {
        status: env.FRAUD_DETECTION_ENABLED ? 'active' : 'inactive',
        version: '1.0.0',
        capabilities: ['pattern_analysis', 'risk_scoring', 'real_time_monitoring', 'location_anomaly', 'time_anomaly', 'device_anomaly', 'behavioral_anomaly'],
      }
    },
  });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/ai/arcface', arcfaceRoutes);
app.use('/api/ai/fraud', fraudRoutes);

// Error handling middleware
app.use(handleUploadError);
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    const server = app.listen(env.PORT, () => {
      logger.info(`🤖 AI Service running on port ${env.PORT}`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🎭 ArcFace: ${env.ARCFACE_ENABLED ? 'Enabled' : 'Disabled'}`);
      logger.info(`🚨 Fraud Detection: ${env.FRAUD_DETECTION_ENABLED ? 'Enabled' : 'Disabled'}`);
      logger.info(`💬 Gemini Chat: ${env.GEMINI_API_KEY ? 'Enabled' : 'Disabled'}`);
      logger.info(`🧠 ML Analytics: ${env.ML_ANALYTICS_ENABLED ? 'Enabled' : 'Disabled'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await closeConnection();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export app for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
