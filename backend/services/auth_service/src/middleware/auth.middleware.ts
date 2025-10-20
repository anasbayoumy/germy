import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.service';
import { tokenBlacklistService } from '../services/token-blacklist.service';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(403).json({
        success: false,
        message: 'Token has been revoked',
      });
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;

    next();
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
  requireRole(['platform_admin'])(req, res, next);
}

export function requireCompanySuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_super_admin'])(req, res, next);
}

export function requireCompanyAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['admin'])(req, res, next);
}

export function requireCompanyAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_super_admin', 'admin'])(req, res, next);
}

export function requireAdminOrSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['admin', 'company_super_admin', 'platform_admin'])(req, res, next);
}

export function requireSuperAdminOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(['company_super_admin', 'platform_admin'])(req, res, next);
}
