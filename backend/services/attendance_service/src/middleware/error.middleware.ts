import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !error.isOperational) {
    message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

export const handleDatabaseError = (error: any): CustomError => {
  if (error.code === '23505') {
    return new CustomError('Duplicate entry', 409);
  } else if (error.code === '23503') {
    return new CustomError('Foreign key constraint violation', 400);
  } else if (error.code === '23502') {
    return new CustomError('Required field missing', 400);
  } else if (error.code === '42P01') {
    return new CustomError('Table does not exist', 500);
  } else if (error.code === 'ECONNREFUSED') {
    return new CustomError('Database connection failed', 503);
  }
  
  return new CustomError('Database error', 500);
};

export const handleAIError = (error: any): CustomError => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    return new CustomError('AI service rate limit exceeded', 429);
  } else if (error.code === 'INVALID_IMAGE') {
    return new CustomError('Invalid image format', 400);
  } else if (error.code === 'PROCESSING_TIMEOUT') {
    return new CustomError('AI processing timeout', 408);
  } else if (error.code === 'API_KEY_INVALID') {
    return new CustomError('AI service authentication failed', 401);
  }
  
  return new CustomError('AI processing error', 500);
};

export const handleFileError = (error: any): CustomError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new CustomError('File too large', 413);
  } else if (error.code === 'LIMIT_FILE_COUNT') {
    return new CustomError('Too many files', 413);
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new CustomError('Unexpected file field', 400);
  } else if (error.code === 'INVALID_FILE_TYPE') {
    return new CustomError('Invalid file type', 400);
  }
  
  return new CustomError('File processing error', 500);
};
