import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
export const uploadSingle = (fieldName: string) => multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
}).single(fieldName);

export const uploadMultiple = (fieldName: string, maxCount: number = 5) => multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: maxCount
  }
}).array(fieldName, maxCount);

// Middleware to require file upload
export function requireFile(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'File is required',
      error: 'MISSING_FILE'
    });
    return;
  }

  next();
}

// Middleware to validate image file
export function validateImageFile(req: Request, res: Response, next: NextFunction): void {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: 'Image file is required',
      error: 'MISSING_IMAGE'
    });
    return;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      success: false,
      message: 'Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP',
      error: 'INVALID_IMAGE_FORMAT'
    });
    return;
  }

  // Check file size (10MB limit)
  if (req.file.size > 10 * 1024 * 1024) {
    res.status(400).json({
      success: false,
      message: 'Image file too large. Maximum size: 10MB',
      error: 'FILE_TOO_LARGE'
    });
    return;
  }

  next();
}

// Error handler for upload errors
export function handleUploadError(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof multer.MulterError) {
    logger.error('Upload error:', {
      service: 'attendance-service',
      error: error.message,
      code: error.code,
      field: error.field
    });

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        res.status(400).json({
          success: false,
          message: 'File too large. Maximum size: 10MB',
          error: 'FILE_TOO_LARGE'
        });
        return;
      case 'LIMIT_FILE_COUNT':
        res.status(400).json({
          success: false,
          message: 'Too many files. Maximum: 1 file',
          error: 'TOO_MANY_FILES'
        });
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        res.status(400).json({
          success: false,
          message: 'Unexpected file field',
          error: 'UNEXPECTED_FILE'
        });
        return;
      default:
        res.status(400).json({
          success: false,
          message: 'Upload error',
          error: 'UPLOAD_ERROR'
        });
        return;
    }
  }

  if (error.message === 'Only image files are allowed') {
    res.status(400).json({
      success: false,
      message: 'Only image files are allowed',
      error: 'INVALID_FILE_TYPE'
    });
    return;
  }

  logger.error('Upload middleware error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_ERROR'
  });
  return;
}