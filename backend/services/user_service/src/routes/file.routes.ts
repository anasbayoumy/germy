import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { uploadSchemas } from '../schemas/upload.schemas';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const fileController = new FileController();

// Apply authentication to all routes
router.use(authenticateToken);

// File upload routes
router.post(
  '/upload',
  upload.single('file'),
  validateRequest(uploadSchemas.uploadFile),
  fileController.uploadFile.bind(fileController)
);

router.post(
  '/upload/multiple',
  upload.array('files', 10), // Maximum 10 files
  validateRequest(uploadSchemas.uploadMultipleFiles),
  fileController.uploadMultipleFiles.bind(fileController)
);

// File management routes
router.get(
  '/',
  validateQuery(uploadSchemas.getFilesQuery),
  fileController.getFiles.bind(fileController)
);

router.get(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  fileController.getFileById.bind(fileController)
);

router.put(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  validateRequest(uploadSchemas.updateFile),
  fileController.updateFile.bind(fileController)
);

router.delete(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  fileController.deleteFile.bind(fileController)
);

// File sharing routes
router.post(
  '/:id/share',
  validateParams(uploadSchemas.fileIdParams),
  validateRequest(uploadSchemas.shareFile),
  fileController.shareFile.bind(fileController)
);

router.get(
  '/:id/shares',
  validateParams(uploadSchemas.fileIdParams),
  validateQuery(uploadSchemas.getFileShares),
  fileController.getFileShares.bind(fileController)
);

router.delete(
  '/:id/shares/:shareId',
  validateParams(uploadSchemas.revokeFileShare),
  fileController.revokeFileShare.bind(fileController)
);

// File analytics routes
router.get(
  '/:id/analytics',
  validateParams(uploadSchemas.fileIdParams),
  validateQuery(uploadSchemas.getFileAnalytics),
  fileController.getFileAnalytics.bind(fileController)
);

router.get(
  '/users/:userId/analytics',
  validateParams(uploadSchemas.getUserFileAnalytics),
  validateQuery(uploadSchemas.getUserFileAnalytics),
  fileController.getUserFileAnalytics.bind(fileController)
);

// File export routes
router.get(
  '/export',
  validateQuery(uploadSchemas.exportFiles),
  fileController.exportFiles.bind(fileController)
);

// File cleanup routes (Platform admin only)
router.post(
  '/cleanup',
  requirePlatformAdmin,
  validateRequest(uploadSchemas.cleanupFiles),
  fileController.cleanupFiles.bind(fileController)
);

export default router;
