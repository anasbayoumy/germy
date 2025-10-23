import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uploadPath = env.UPLOAD_PATH || './uploads';
    // Ensure directory exists
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// File filter - Allow all file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  // Allow all file types for general file uploads
  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single('profilePicture');

// Middleware for multiple files upload
export const uploadMultiple = upload.array('files', 5);

// Error handling middleware for multer
export function handleUploadError(error: any, req: Request, res: any, next: any) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.',
      });
    }
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'File type not supported.',
    });
  }

  logger.error('Upload error:', error);
  next(error);
}

// Middleware to check if file was uploaded
export function requireFile(req: Request, res: any, next: any) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  next();
}