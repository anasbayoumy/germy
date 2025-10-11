import { Router } from 'express';
import { FileUploadController } from '../controllers/fileUpload.controller';
import { authenticateToken, requireUserAccess } from '../middleware/auth.middleware';
import { validateParams, validateRequest } from '../middleware/validation.middleware';
import { uploadSingle, requireFile } from '../middleware/upload.middleware';
import { fileUploadSchemas } from '../schemas/fileUpload.schemas';

const router = Router();
const fileUploadController = new FileUploadController();

// Apply authentication to all routes
router.use(authenticateToken);

// Profile picture routes
router.post(
  '/profiles/:userId',
  validateParams(fileUploadSchemas.userIdParams),
  requireUserAccess,
  uploadSingle,
  requireFile,
  fileUploadController.uploadProfilePicture
);

router.delete(
  '/profiles/:userId',
  validateParams(fileUploadSchemas.userIdParams),
  requireUserAccess,
  fileUploadController.deleteProfilePicture
);

router.get(
  '/profiles/:userId',
  validateParams(fileUploadSchemas.userIdParams),
  fileUploadController.getProfilePicture
);

// Advanced file operations
router.get(
  '/profiles/:userId/files',
  validateParams(fileUploadSchemas.userIdParams),
  requireUserAccess,
  fileUploadController.listUserFiles
);

router.get(
  '/profiles/:userId/files/:filename/metadata',
  validateParams(fileUploadSchemas.fileMetadataParams),
  requireUserAccess,
  fileUploadController.getFileMetadata
);

router.get(
  '/profiles/:userId/files/:filename',
  validateParams(fileUploadSchemas.fileMetadataParams),
  requireUserAccess,
  fileUploadController.serveFile
);

router.delete(
  '/profiles/:userId/files/bulk',
  validateParams(fileUploadSchemas.userIdParams),
  validateRequest(fileUploadSchemas.bulkDeleteFiles),
  requireUserAccess,
  fileUploadController.bulkDeleteFiles
);

export default router;