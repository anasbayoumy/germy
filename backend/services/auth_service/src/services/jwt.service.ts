import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface TokenPayload {
  userId: string;
  companyId: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  try {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'germy-auth-service',
      audience: 'germy-platform',
    } as jwt.SignOptions);
  } catch (error) {
    logger.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'germy-auth-service',
      audience: 'germy-platform',
    } as jwt.VerifyOptions) as TokenPayload;

    return payload;
  } catch (error) {
    logger.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Token decode error:', error);
    return null;
  }
}