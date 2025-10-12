import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { handleFileError } from './error.middleware';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), env.UPLOAD_PATH);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = env.ALLOWED_FILE_TYPES.split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 5, // Maximum 5 files per request
  },
});

// Upload middleware for single file
export const uploadSingle = (fieldName: string = 'photo') => {
  return upload.single(fieldName);
};

// Upload middleware for multiple files
export const uploadMultiple = (fieldName: string = 'photos', maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

// Upload middleware for specific fields
export const uploadFields = (fields: multer.Field[]) => {
  return upload.fields(fields);
};

// Middleware to handle upload errors
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    const customError = handleFileError(error);
    next(customError);
    return;
  }
  
  if (error.message === 'Invalid file type. Only images are allowed.') {
    const customError = handleFileError({ code: 'INVALID_FILE_TYPE' });
    next(customError);
    return;
  }
  
  next(error);
};

// Middleware to require file upload
export const requireFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      message: 'File upload is required',
    });
    return;
  }
  next();
};

// Middleware to validate image file
export const validateImageFile = (req: Request, res: Response, next: NextFunction): void => {
  const file = req.file as Express.Multer.File;
  
  if (!file) {
    res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
    return;
  }
  
  // Check file size
  if (file.size > env.MAX_FILE_SIZE) {
    res.status(413).json({
      success: false,
      message: 'File too large',
    });
    return;
  }
  
  // Check file type
  const allowedTypes = env.ALLOWED_FILE_TYPES.split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400).json({
      success: false,
      message: 'Invalid file type',
    });
    return;
  }
  
  // Log file upload
  logger.info('File uploaded successfully', {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    userId: (req as any).user?.userId,
  });
  
  next();
};

// Middleware to process uploaded image
export const processImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file as Express.Multer.File;
    
    if (!file) {
      next();
      return;
    }
    
    // Add file metadata to request
    (req as any).fileMetadata = {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      uploadedAt: new Date(),
    };
    
    next();
  } catch (error) {
    logger.error('Image processing error:', error);
    next(error);
  }
};

// Middleware to clean up uploaded files on error
export const cleanupFiles = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Clean up files if response is an error
    if (res.statusCode >= 400) {
      const file = req.file as Express.Multer.File;
      if (file && file.path) {
        try {
          require('fs').unlinkSync(file.path);
          logger.info('Cleaned up uploaded file:', file.filename);
        } catch (error) {
          logger.error('Error cleaning up file:', error);
        }
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export default upload;
