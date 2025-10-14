import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function handleUploadError(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Upload error:', {
    service: 'ai-service',
    error: error.message,
    url: req.url,
    method: req.method
  });

  res.status(400).json({
    success: false,
    message: 'Upload failed',
    error: error.message
  });
}
