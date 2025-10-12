import winston from 'winston';
import { env } from '../config/env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create logger instance
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'attendance-service',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });
  
  next();
};

// Add error logging
export const errorLogger = (error: Error, req?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
  });
};

// Add AI processing logger
export const aiLogger = (operation: string, data: any, duration?: number) => {
  logger.info('AI Processing', {
    operation,
    duration: duration ? `${duration}ms` : undefined,
    data: {
      ...data,
      // Remove sensitive data from logs
      photo: data.photo ? '[PHOTO_DATA]' : undefined,
      livenessData: data.livenessData ? '[LIVENESS_DATA]' : undefined,
    },
  });
};

// Add fraud detection logger
export const fraudLogger = (userId: string, riskScore: number, flags: string[], evidence: any) => {
  logger.warn('Fraud Detection Alert', {
    userId,
    riskScore,
    flags,
    evidence: {
      ...evidence,
      // Remove sensitive data from logs
      photo: evidence.photo ? '[PHOTO_DATA]' : undefined,
      location: evidence.location ? '[LOCATION_DATA]' : undefined,
    },
  });
};

// Add performance logger
export const performanceLogger = (operation: string, duration: number, metadata?: any) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    metadata,
  });
};

export default logger;
