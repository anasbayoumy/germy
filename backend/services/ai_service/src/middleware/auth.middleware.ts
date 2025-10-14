import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    companyId?: string;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // For now, we'll skip authentication in the AI service
  // In production, you would validate JWT tokens here
  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // For now, we'll skip role validation in the AI service
    // In production, you would check user roles here
    next();
  };
}
