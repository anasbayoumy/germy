import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { handleUploadError } from './middleware/upload.middleware';

// Import routes
import userRoutes from './routes/user.routes';
import teamRoutes from './routes/team.routes';
import departmentRoutes from './routes/department.routes';
import fileUploadRoutes from './routes/fileUpload.routes';

// Load environment variables
config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'User Service is running',
    timestamp: new Date().toISOString(),
    service: 'user-service',
    version: '1.0.0',
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/files', fileUploadRoutes);

// Error handling middleware
app.use(handleUploadError);
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;