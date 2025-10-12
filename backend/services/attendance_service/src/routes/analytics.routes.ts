import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { analyticsSchemas } from '../schemas/analytics.schemas';

const router = Router();
const analyticsController = new AnalyticsController();

// Apply authentication to all routes
router.use(authenticateToken);

// Productivity analytics
router.get(
  '/productivity/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getProductivityAnalyticsQuery),
  analyticsController.getProductivityAnalytics
);

router.get(
  '/productivity/user/:userId',
  validateParams(analyticsSchemas.userIdParams),
  validateQuery(analyticsSchemas.getUserProductivityQuery),
  analyticsController.getUserProductivity
);

// Attendance analytics
router.get(
  '/attendance/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getAttendanceAnalyticsQuery),
  analyticsController.getAttendanceAnalytics
);

router.get(
  '/attendance/user/:userId',
  validateParams(analyticsSchemas.userIdParams),
  validateQuery(analyticsSchemas.getUserAttendanceQuery),
  analyticsController.getUserAttendance
);

// Fraud analytics
router.get(
  '/fraud/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getFraudAnalyticsQuery),
  analyticsController.getFraudAnalytics
);

// Performance analytics
router.get(
  '/performance/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getPerformanceAnalyticsQuery),
  analyticsController.getPerformanceAnalytics
);

// Dashboard data
router.get(
  '/dashboard/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getDashboardDataQuery),
  analyticsController.getDashboardData
);

router.get(
  '/dashboard/user/:userId',
  validateParams(analyticsSchemas.userIdParams),
  validateQuery(analyticsSchemas.getUserDashboardQuery),
  analyticsController.getUserDashboard
);

// Reports
router.get(
  '/reports/:companyId',
  validateParams(analyticsSchemas.companyIdParams),
  validateQuery(analyticsSchemas.getReportsQuery),
  analyticsController.getReports
);

router.post(
  '/reports/generate',
  validateRequest(analyticsSchemas.generateReport),
  analyticsController.generateReport
);

export default router;
