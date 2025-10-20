import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { securityLoggingService } from '../services/security-logging.service';

/**
 * Enhanced rate limiting middleware with different limits for different endpoints
 */

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 10000, // 100 requests per 15 minutes in production, 10000 in dev (effectively disabled)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting in development
    return env.NODE_ENV !== 'production';
  },
  handler: async (req: Request, res: Response) => {
    // Log rate limit exceeded event
    await securityLoggingService.logRateLimitExceeded(req.ip || 'unknown', req.url, req.get('User-Agent'));
    
    logger.warn('Rate limit exceeded - General API', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Authentication endpoints rate limiting (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 5 : 1000, // 5 login attempts per 15 minutes in production, 1000 in dev (effectively disabled)
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req: Request) => {
    // Skip rate limiting in development
    return env.NODE_ENV !== 'production';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Authentication', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.body ? { email: req.body.email } : undefined,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Password reset rate limiting (very strict)
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 3 : 10, // 3 password reset attempts per hour in production
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Password Reset', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.body ? { email: req.body.email } : undefined,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: '1 hour',
    });
  },
});

// Registration rate limiting
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 3 : 1000, // 3 registration attempts per hour in production, 1000 in dev (effectively disabled)
  message: {
    success: false,
    message: 'Too many registration attempts from this IP, please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting in development
    return env.NODE_ENV !== 'production';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Registration', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      body: req.body ? { email: req.body.email, companyName: req.body.companyName } : undefined,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts from this IP, please try again later.',
      retryAfter: '1 hour',
    });
  },
});

// Platform admin endpoints rate limiting (very strict)
export const platformAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 10 : 100, // 10 requests per 15 minutes in production
  message: {
    success: false,
    message: 'Too many platform admin requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Platform Admin', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many platform admin requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Token verification rate limiting
export const tokenVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 20 : 100, // 20 token verifications per 15 minutes in production
  message: {
    success: false,
    message: 'Too many token verification requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Token Verification', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many token verification requests from this IP, please try again later.',
      retryAfter: '15 minutes',
    });
  },
});

// Health check rate limiting (very permissive)
export const healthCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'production' ? 60 : 1000, // 60 health checks per minute in production
  message: {
    success: false,
    message: 'Too many health check requests from this IP, please try again later.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded - Health Check', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many health check requests from this IP, please try again later.',
      retryAfter: '1 minute',
    });
  },
});

// Create a custom rate limiter for specific use cases
export function createCustomLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded - Custom', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        key: options.keyGenerator ? options.keyGenerator(req) : req.ip,
      });
      
      res.status(429).json({
        success: false,
        message: options.message,
      });
    },
  });
}

// Rate limiter for user-specific actions (by user ID)
export const userActionLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 50 : 200, // 50 user actions per 15 minutes in production
  message: 'Too many user actions, please try again later.',
  keyGenerator: (req: Request) => {
    // Use user ID if available, otherwise fall back to IP
    const user = (req as any).user;
    return user ? `user:${user.userId}` : (req.ip || 'unknown');
  },
});

// Rate limiter for company-specific actions (by company ID)
export const companyActionLimiter = createCustomLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'production' ? 100 : 500, // 100 company actions per 15 minutes in production
  message: 'Too many company actions, please try again later.',
  keyGenerator: (req: Request) => {
    // Use company ID if available, otherwise fall back to IP
    const user = (req as any).user;
    return user ? `company:${user.companyId}` : (req.ip || 'unknown');
  },
});

// Export rate limiting configuration for monitoring
export const rateLimitConfig = {
  general: {
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 100 : 1000,
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 5 : 50,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 3 : 10,
  },
  registration: {
    windowMs: env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 3 : 10,
  },
  platformAdmin: {
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 10 : 100,
  },
  tokenVerification: {
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 20 : 100,
  },
  healthCheck: {
    windowMs: 1 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 60 : 1000,
  },
};
