import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    companyId?: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'MISSING_TOKEN'
    });
    return;
  }

  try {
    const jwtSecret = process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-at-least-32-characters-long';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId
    };

    next();
  } catch (error) {
    logger.warn('Invalid token:', {
      service: 'attendance-service',
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'INVALID_TOKEN'
    });
    return;
  }
}

export function requireUserAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { userId } = req.params;
  const { userId: tokenUserId, role, companyId } = req.user!;

  // Allow if user is accessing their own data
  if (userId === tokenUserId) {
    next();
    return;
  }

  // Allow if user has admin or higher role
  if (role === 'company_admin' || role === 'company_super_admin' || role === 'platform_admin') {
    next();
    return;
  }

  logger.warn('Access denied for user data', {
    service: 'attendance-service',
    requestedUserId: userId,
    tokenUserId,
    role,
    companyId
  });

  res.status(403).json({
    success: false,
    message: 'Access denied',
    error: 'ACCESS_DENIED'
  });
  return;
}

export function requireAdminAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { role } = req.user!;

  if (role === 'company_admin' || role === 'company_super_admin' || role === 'platform_admin') {
    next();
    return;
  }

  logger.warn('Admin access required', {
    service: 'attendance-service',
    role,
    ip: req.ip
  });

  res.status(403).json({
    success: false,
    message: 'Admin access required',
    error: 'ADMIN_ACCESS_REQUIRED'
  });
  return;
}

export function requireSuperAdminAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { role } = req.user!;

  if (role === 'company_super_admin' || role === 'platform_admin') {
    next();
    return;
  }

  logger.warn('Super admin access required', {
    service: 'attendance-service',
    role,
    ip: req.ip
  });

  res.status(403).json({
    success: false,
    message: 'Super admin access required',
    error: 'SUPER_ADMIN_ACCESS_REQUIRED'
  });
  return;
}
