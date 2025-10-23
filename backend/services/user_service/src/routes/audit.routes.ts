import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';
import { validateQuery, validateRequest } from '../middleware/validation.middleware';
import { auditSchemas } from '../schemas/audit.schemas';

const router = Router();
const auditController = new AuditController();

// Apply authentication to all routes
router.use(authenticateToken);

// Audit trail routes
router.get(
  '/trail',
  validateQuery(auditSchemas.getAuditTrailQuery),
  auditController.getAuditTrail.bind(auditController)
);

router.get(
  '/security-events',
  validateQuery(auditSchemas.getSecurityEventsQuery),
  auditController.getSecurityEvents.bind(auditController)
);

router.get(
  '/export',
  validateQuery(auditSchemas.exportAuditLogQuery),
  auditController.exportAuditLog.bind(auditController)
);

// Platform admin only routes
router.post(
  '/cleanup',
  requirePlatformAdmin,
  validateRequest(auditSchemas.cleanupOldLogs),
  auditController.cleanupOldLogs.bind(auditController)
);

export default router;
