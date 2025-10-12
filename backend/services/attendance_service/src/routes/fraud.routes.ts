import { Router } from 'express';
import { FraudController } from '../controllers/fraud.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { fraudSchemas } from '../schemas/fraud.schemas';

const router = Router();
const fraudController = new FraudController();

// Apply authentication to all routes
router.use(authenticateToken);

// Fraud detection endpoints
router.get(
  '/dashboard/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getFraudDashboardQuery),
  fraudController.getFraudDashboard
);

router.get(
  '/alerts/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getFraudAlertsQuery),
  fraudController.getFraudAlerts
);

router.get(
  '/patterns/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getFraudPatternsQuery),
  fraudController.getFraudPatterns
);

// Fraud analysis
router.get(
  '/analysis/:attendanceId',
  validateParams(fraudSchemas.attendanceIdParams),
  fraudController.getFraudAnalysis
);

router.post(
  '/analyze',
  validateRequest(fraudSchemas.analyzeFraud),
  fraudController.analyzeFraud
);

// Risk assessment
router.get(
  '/risk/:userId',
  validateParams(fraudSchemas.userIdParams),
  validateQuery(fraudSchemas.getRiskAssessmentQuery),
  fraudController.getRiskAssessment
);

router.post(
  '/risk/calculate',
  validateRequest(fraudSchemas.calculateRisk),
  fraudController.calculateRisk
);

// Fraud flags management
router.get(
  '/flags/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getFraudFlagsQuery),
  fraudController.getFraudFlags
);

router.put(
  '/flags/:flagId/resolve',
  validateParams(fraudSchemas.flagIdParams),
  validateRequest(fraudSchemas.resolveFraudFlag),
  fraudController.resolveFraudFlag
);

router.put(
  '/flags/:flagId/ignore',
  validateParams(fraudSchemas.flagIdParams),
  validateRequest(fraudSchemas.ignoreFraudFlag),
  fraudController.ignoreFraudFlag
);

// Fraud prevention
router.get(
  '/prevention/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getPreventionMetricsQuery),
  fraudController.getPreventionMetrics
);

router.post(
  '/prevention/update',
  validateRequest(fraudSchemas.updatePreventionSettings),
  fraudController.updatePreventionSettings
);

// Fraud trends
router.get(
  '/trends/:companyId',
  validateParams(fraudSchemas.companyIdParams),
  validateQuery(fraudSchemas.getFraudTrendsQuery),
  fraudController.getFraudTrends
);

export default router;
