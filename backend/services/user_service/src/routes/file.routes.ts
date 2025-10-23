import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { 
  authenticateToken, 
  requirePlatformAdmin,
  requireOwnDataAccess,
  requireCompanyAdminOrSuperAdmin
} from '../middleware/auth.middleware';
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
  fileController.uploadFile.bind(fileController) // Users can upload their own files
);

router.post(
  '/upload/multiple',
  upload.array('files', 10), // Maximum 10 files
  validateRequest(uploadSchemas.uploadMultipleFiles),
  fileController.uploadMultipleFiles.bind(fileController) // Users can upload multiple files
);

// File management routes
router.get(
  '/',
  validateQuery(uploadSchemas.getFilesQuery),
  requireOwnDataAccess, // Users can only see their own files, admins can see company files
  fileController.getFiles.bind(fileController)
);

router.get(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  requireOwnDataAccess, // Users can only access their own files, admins can access company files
  fileController.getFileById.bind(fileController)
);

router.put(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  validateRequest(uploadSchemas.updateFile),
  requireOwnDataAccess, // Users can only update their own files, admins can update company files
  fileController.updateFile.bind(fileController)
);

router.delete(
  '/:id',
  validateParams(uploadSchemas.fileIdParams),
  requireOwnDataAccess, // Users can only delete their own files, admins can delete company files
  fileController.deleteFile.bind(fileController)
);

// File sharing routes
router.post(
  '/:id/share',
  validateParams(uploadSchemas.fileIdParams),
  validateRequest(uploadSchemas.shareFile),
  requireOwnDataAccess, // Users can only share their own files, admins can share company files
  fileController.shareFile.bind(fileController)
);

router.get(
  '/:id/shares',
  validateParams(uploadSchemas.fileIdParams),
  validateQuery(uploadSchemas.getFileShares),
  requireOwnDataAccess, // Users can only see shares of their own files, admins can see company file shares
  fileController.getFileShares.bind(fileController)
);

router.delete(
  '/:id/shares/:shareId',
  validateParams(uploadSchemas.revokeFileShare),
  requireOwnDataAccess, // Users can only revoke shares of their own files, admins can revoke company file shares
  fileController.revokeFileShare.bind(fileController)
);

// File analytics routes
router.get(
  '/:id/analytics',
  validateParams(uploadSchemas.fileIdParams),
  validateQuery(uploadSchemas.getFileAnalytics),
  requireOwnDataAccess, // Users can only see analytics of their own files, admins can see company file analytics
  fileController.getFileAnalytics.bind(fileController)
);

router.get(
  '/users/:userId/analytics',
  validateParams(uploadSchemas.getUserFileAnalytics),
  validateQuery(uploadSchemas.getUserFileAnalytics),
  requireOwnDataAccess, // Users can only see their own file analytics, admins can see company user analytics
  fileController.getUserFileAnalytics.bind(fileController)
);

// File export routes
router.get(
  '/export',
  validateQuery(uploadSchemas.exportFiles),
  requireCompanyAdminOrSuperAdmin, // Only admins can export files
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
