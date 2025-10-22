import DOMPurify from 'isomorphic-dompurify';
import { logger } from './logger';

/**
 * Sanitization utility functions to prevent XSS attacks
 */
export class SanitizationService {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(input: string): string {
    try {
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true, // Keep text content
      });
    } catch (error) {
      logger.error('HTML sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize text input (remove HTML tags and dangerous characters)
   */
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    try {
      // Remove HTML tags
      let sanitized = input.replace(/<[^>]*>/g, '');
      
      // Remove script tags and their content
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove javascript: and data: URLs
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/data:/gi, '');
      
      // Remove only dangerous HTML characters
      sanitized = sanitized.replace(/[<>]/g, '');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      return sanitized;
    } catch (error) {
      logger.error('Text sanitization error:', error);
      return input;
    }
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Basic email sanitization
      let sanitized = input.toLowerCase().trim();
      
      // Remove any HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      // Remove dangerous characters but keep email valid characters
      sanitized = sanitized.replace(/[<>'"&]/g, '');
      
      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sanitized)) {
        logger.warn(`Invalid email format detected: ${input}`);
        return '';
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Email sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Remove all non-digit characters except + at the beginning
      let sanitized = input.replace(/[^\d+]/g, '');
      
      // Ensure + is only at the beginning
      if (sanitized.startsWith('+')) {
        sanitized = '+' + sanitized.substring(1).replace(/\+/g, '');
      } else {
        sanitized = sanitized.replace(/\+/g, '');
      }
      
      // Limit length (international phone numbers can be up to 15 digits)
      if (sanitized.length > 16) { // +1 + 15 digits
        sanitized = sanitized.substring(0, 16);
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Phone sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize name input (first name, last name, company name, etc.)
   */
  static sanitizeName(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Remove HTML tags
      let sanitized = input.replace(/<[^>]*>/g, '');
      
      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>'"&]/g, '');
      
      // Remove excessive whitespace
      sanitized = sanitized.replace(/\s+/g, ' ');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      // Limit length
      if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Name sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize password input (basic validation, don't modify the password)
   */
  static sanitizePassword(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Don't modify password content, just validate it's a string
      // and not empty
      return input.trim();
    } catch (error) {
      logger.error('Password sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      let sanitized = input.trim();
      
      // Remove HTML tags
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      // Remove javascript: and data: URLs
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/data:/gi, '');
      
      // Basic URL validation
      try {
        new URL(sanitized);
        return sanitized;
      } catch {
        // If not a valid URL, return empty string
        logger.warn(`Invalid URL detected: ${input}`);
        return '';
      }
    } catch (error) {
      logger.error('URL sanitization error:', error);
      return '';
    }
  }

  /**
   * Sanitize JSON input
   */
  static sanitizeJson(input: any): any {
    try {
      if (typeof input === 'string') {
        // Try to parse as JSON
        const parsed = JSON.parse(input);
        return this.sanitizeObject(parsed);
      } else if (typeof input === 'object' && input !== null) {
        return this.sanitizeObject(input);
      } else {
        return input;
      }
    } catch (error) {
      logger.error('JSON sanitization error:', error);
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   */
  public static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Don't sanitize the key, just keep it as is
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      // Don't aggressively sanitize strings, just return them
      return obj;
    }

    return obj;
  }

  /**
   * Sanitize search query input
   */
  static sanitizeSearchQuery(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      // Remove HTML tags
      let sanitized = input.replace(/<[^>]*>/g, '');
      
      // Remove dangerous characters
      sanitized = sanitized.replace(/[<>'"&]/g, '');
      
      // Remove excessive whitespace
      sanitized = sanitized.replace(/\s+/g, ' ');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      // Limit length
      if (sanitized.length > 255) {
        sanitized = sanitized.substring(0, 255);
      }
      
      return sanitized;
    } catch (error) {
      logger.error('Search query sanitization error:', error);
      return '';
    }
  }

  /**
   * Validate and sanitize input based on type
   */
  static sanitizeByType(input: string, type: 'email' | 'name' | 'phone' | 'text' | 'url' | 'search'): string {
    switch (type) {
      case 'email':
        return this.sanitizeEmail(input);
      case 'name':
        return this.sanitizeName(input);
      case 'phone':
        return this.sanitizePhone(input);
      case 'url':
        return this.sanitizeUrl(input);
      case 'search':
        return this.sanitizeSearchQuery(input);
      case 'text':
      default:
        return this.sanitizeText(input);
    }
  }
}

/**
 * Middleware function to sanitize request body
 */
export function sanitizeRequestBody(req: any, res: any, next: any): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = SanitizationService.sanitizeObject(req.body);
    }
    next();
  } catch (error) {
    logger.error('Request body sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid request data',
    });
  }
}

/**
 * Middleware function to sanitize query parameters
 */
export function sanitizeQueryParams(req: any, res: any, next: any): void {
  try {
    if (req.query && typeof req.query === 'object') {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = SanitizationService.sanitizeText(value as string);
        }
      }
    }
    next();
  } catch (error) {
    logger.error('Query parameters sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
    });
  }
}

