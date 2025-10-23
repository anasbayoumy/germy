import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { authenticateToken, requireCompanyAdminOrHigher, requirePlatformAdmin } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { securitySchemas } from '../schemas/security.schemas';

const router = Router();
const securityController = new SecurityController();

// Apply authentication to all routes
router.use(authenticateToken);

// Security settings routes
router.get(
  '/settings',
  requireCompanyAdminOrHigher,
  securityController.getSecuritySettings.bind(securityController)
);

router.put(
  '/settings',
  requirePlatformAdmin,
  validateRequest(securitySchemas.updateSecuritySettings),
  securityController.updateSecuritySettings.bind(securityController)
);

// Password validation
router.post(
  '/validate-password',
  validateRequest(securitySchemas.validatePassword),
  securityController.validatePasswordStrength.bind(securityController)
);

// Device management routes
router.get(
  '/devices/:targetUserId',
  validateParams(securitySchemas.userIdParams),
  securityController.getUserDevices.bind(securityController)
);

router.delete(
  '/devices/:deviceId/:targetUserId',
  validateParams(securitySchemas.revokeDeviceParams),
  securityController.revokeDevice.bind(securityController)
);

// Security events and reports
router.get(
  '/events',
  requireCompanyAdminOrHigher,
  validateQuery(securitySchemas.getSecurityEventsQuery),
  securityController.getSecurityEvents.bind(securityController)
);

router.get(
  '/report',
  requireCompanyAdminOrHigher,
  validateQuery(securitySchemas.generateSecurityReportQuery),
  securityController.generateSecurityReport.bind(securityController)
);

export default router;
