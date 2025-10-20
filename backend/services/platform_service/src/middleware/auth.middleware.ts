import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: string; companyId?: string };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ success: false, message: 'Missing token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = { userId: decoded.userId, role: decoded.role, companyId: decoded.companyId };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export function requirePlatformAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'platform_admin') {
    res.status(403).json({ success: false, message: 'Platform admin access required' });
    return;
  }
  next();
}


