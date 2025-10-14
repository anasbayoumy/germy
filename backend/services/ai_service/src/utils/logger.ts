import winston from 'winston';
import { env } from '../config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define the format for the logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}] [AI-SERVICE]: ${info.message}`
  )
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transport in production
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/ai-service-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }) as any,
    new winston.transports.File({
      filename: 'logs/ai-service-combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }) as any
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// AI Service specific logging functions
export const logAIServiceRequest = (
  serviceName: string,
  requestId: string,
  userId?: string,
  companyId?: string
) => {
  logger.info(`AI Service Request: ${serviceName}`, {
    requestId,
    userId,
    companyId,
    timestamp: new Date().toISOString(),
  });
};

export const logAIServiceResponse = (
  serviceName: string,
  requestId: string,
  processingTime: number,
  status: 'success' | 'error',
  error?: string
) => {
  const logLevel = status === 'success' ? 'info' : 'error';
  logger[logLevel](`AI Service Response: ${serviceName}`, {
    requestId,
    processingTime,
    status,
    error,
    timestamp: new Date().toISOString(),
  });
};

export const logFaceEncoding = (
  userId: string,
  quality: number,
  processingTime: number
) => {
  logger.info('Face encoding completed', {
    userId,
    quality,
    processingTime,
    timestamp: new Date().toISOString(),
  });
};

export const logFaceComparison = (
  userId: string,
  similarity: number,
  isMatch: boolean,
  processingTime: number
) => {
  logger.info('Face comparison completed', {
    userId,
    similarity,
    isMatch,
    processingTime,
    timestamp: new Date().toISOString(),
  });
};

export const logFraudDetection = (
  attendanceId: string,
  riskScore: number,
  riskLevel: string,
  processingTime: number
) => {
  logger.info('Fraud detection completed', {
    attendanceId,
    riskScore,
    riskLevel,
    processingTime,
    timestamp: new Date().toISOString(),
  });
};

export const logChatMessage = (
  userId: string,
  messageLength: number,
  responseTime: number,
  language?: string
) => {
  logger.info('Chat message processed', {
    userId,
    messageLength,
    responseTime,
    language,
    timestamp: new Date().toISOString(),
  });
};

export const logMLPrediction = (
  userId: string,
  predictionType: string,
  confidence: number,
  processingTime: number
) => {
  logger.info('ML prediction completed', {
    userId,
    predictionType,
    confidence,
    processingTime,
    timestamp: new Date().toISOString(),
  });
};

// Error logging with context
export const logError = (error: Error, context?: any) => {
  logger.error('AI Service Error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: any
) => {
  logger.info(`Performance: ${operation}`, {
    operation,
    duration,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

// Security logging
export const logSecurityEvent = (
  event: string,
  userId?: string,
  ipAddress?: string,
  details?: any
) => {
  logger.warn(`Security Event: ${event}`, {
    event,
    userId,
    ipAddress,
    details,
    timestamp: new Date().toISOString(),
  });
};
