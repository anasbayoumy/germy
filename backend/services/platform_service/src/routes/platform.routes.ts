import { Router } from 'express';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';
import { PlatformController } from '../controllers/platform.controller';
// Only use existing DB; remove advanced create schemas usage

const router = Router();
const controller = new PlatformController();

router.get('/status', authenticateToken, requirePlatformAdmin, controller.getStatus.bind(controller));

// Configs
// Plans
router.get('/plans', authenticateToken, requirePlatformAdmin, controller.listPlans.bind(controller));

// Companies and settings
router.get('/companies', authenticateToken, requirePlatformAdmin, controller.listCompanies.bind(controller));
router.get('/companies/:companyId/settings', authenticateToken, requirePlatformAdmin, controller.getCompanySettings.bind(controller));
router.post('/companies/:companyId/settings', authenticateToken, requirePlatformAdmin, controller.updateCompanySettings.bind(controller));

// Company approvals proxy to auth-service
router.get('/companies/pending', authenticateToken, requirePlatformAdmin, controller.listPendingCompanies.bind(controller));
router.post('/companies/:companyId/approve', authenticateToken, requirePlatformAdmin, controller.approveCompany.bind(controller));
router.post('/companies/:companyId/reject', authenticateToken, requirePlatformAdmin, controller.rejectCompany.bind(controller));

// Subscriptions
router.get('/subscriptions', authenticateToken, requirePlatformAdmin, controller.listSubscriptions.bind(controller));

// Audit & Integrations
router.get('/audit-logs', authenticateToken, requirePlatformAdmin, controller.listAuditLogs.bind(controller));
router.get('/integrations', authenticateToken, requirePlatformAdmin, controller.listIntegrations.bind(controller));

export default router;


