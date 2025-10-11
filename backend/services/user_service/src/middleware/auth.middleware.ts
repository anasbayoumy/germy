import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    // Validate token locally using JWT
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'germy-auth-service',
        audience: 'germy-platform',
      }) as { userId: string; companyId: string; role: string };

      req.user = {
        userId: payload.userId,
        companyId: payload.companyId,
        role: payload.role,
      };

      next();
    } catch (jwtError) {
      logger.error('JWT verification error:', jwtError);
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }
}


export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

export function requirePlatformAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['platform_super_admin'])(req, res, next);
}

export function requireCompanySuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_super_admin'])(req, res, next);
}

export function requireCompanyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_admin'])(req, res, next);
}

export function requireCompanyAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_super_admin', 'company_admin'])(req, res, next);
}

export function requireEmployeeOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['platform_super_admin', 'company_super_admin', 'company_admin', 'employee'])(req, res, next);
}

// Middleware to check if user can access specific user data
export function requireUserAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const { role, userId, companyId } = req.user;
  const targetUserId = req.params.id || req.params.userId;

  // Platform admins can access any user
  if (role === 'platform_super_admin') {
    next();
    return;
  }

  // Users can access their own data
  if (targetUserId === userId) {
    next();
    return;
  }

  // Company admins and super admins can access users in their company
  if (['company_super_admin', 'company_admin'].includes(role)) {
    // The service layer will handle company validation
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: 'Insufficient permissions to access this user',
  });
  return;
}