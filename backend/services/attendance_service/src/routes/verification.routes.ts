import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller';
import { authenticateToken, requireUserAccess } from '../middleware/auth.middleware';
import { validateRequest, validateParams } from '../middleware/validation.middleware';
import { uploadSingle, requireFile, validateImageFile } from '../middleware/upload.middleware';
import { verificationSchemas } from '../schemas/verification.schemas';

const router = Router();
const verificationController = new VerificationController();

// Apply authentication to all routes
router.use(authenticateToken);

// AI-powered verification endpoints
router.post(
  '/face',
  uploadSingle('photo'),
  requireFile,
  validateImageFile,
  validateRequest(verificationSchemas.verifyFace),
  verificationController.verifyFace
);

router.post(
  '/activity',
  validateRequest(verificationSchemas.verifyActivity),
  verificationController.verifyActivity
);

router.post(
  '/location',
  validateRequest(verificationSchemas.verifyLocation),
  verificationController.verifyLocation
);

router.post(
  '/liveness',
  uploadSingle('video'),
  requireFile,
  validateRequest(verificationSchemas.verifyLiveness),
  verificationController.verifyLiveness
);

// Multi-factor verification
router.post(
  '/comprehensive',
  uploadSingle('photo'),
  requireFile,
  validateImageFile,
  validateRequest(verificationSchemas.comprehensiveVerification),
  verificationController.comprehensiveVerification
);

// Device verification
router.post(
  '/device',
  validateRequest(verificationSchemas.verifyDevice),
  verificationController.verifyDevice
);

// Geofence verification
router.post(
  '/geofence',
  validateRequest(verificationSchemas.verifyGeofence),
  verificationController.verifyGeofence
);

// Verification results
router.get(
  '/results/:verificationId',
  validateParams(verificationSchemas.verificationIdParams),
  verificationController.getVerificationResults
);

export default router;
