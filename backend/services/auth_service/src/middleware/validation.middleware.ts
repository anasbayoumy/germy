import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { SanitizationService } from '../utils/sanitization';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Sanitize request data before validation
      const sanitizedBody = SanitizationService.sanitizeObject(req.body);
      const sanitizedQuery = SanitizationService.sanitizeObject(req.query);
      const sanitizedParams = SanitizationService.sanitizeObject(req.params);

      // Update request with sanitized data
      req.body = sanitizedBody;
      req.query = sanitizedQuery;
      req.params = sanitizedParams;

      schema.parse({
        body: sanitizedBody,
        query: sanitizedQuery,
        params: sanitizedParams,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation error:', errorMessages);

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }

      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
      return;
    }
  };
}
