import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireUserAccess } from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { userSchemas } from '../schemas/user.schemas';

const router = Router();
const userController = new UserController();

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes
router.get(
  '/',
  validateQuery(userSchemas.getUsersQuery),
  userController.getUsers.bind(userController)
);

router.get(
  '/search',
  validateQuery(userSchemas.searchUsersQuery),
  userController.searchUsers.bind(userController)
);

router.get(
  '/:id',
  validateParams(userSchemas.userIdParams),
  requireUserAccess,
  userController.getUserById.bind(userController)
);

router.put(
  '/:id',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUser),
  requireUserAccess,
  userController.updateUser.bind(userController)
);

router.patch(
  '/:id/deactivate',
  validateParams(userSchemas.userIdParams),
  requireUserAccess,
  userController.deactivateUser.bind(userController)
);

// User preferences routes
router.get(
  '/:id/preferences',
  validateParams(userSchemas.userIdParams),
  requireUserAccess,
  userController.getUserPreferences.bind(userController)
);

router.put(
  '/:id/preferences',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUserPreferences),
  requireUserAccess,
  userController.updateUserPreferences.bind(userController)
);

// User activities routes
router.get(
  '/:id/activities',
  validateParams(userSchemas.userIdParams),
  validateQuery(userSchemas.getUserActivitiesQuery),
  requireUserAccess,
  userController.getUserActivities.bind(userController)
);

// User settings routes
router.get(
  '/:id/settings',
  validateParams(userSchemas.userIdParams),
  requireUserAccess,
  userController.getUserSettings.bind(userController)
);

router.put(
  '/:id/settings',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUserSettings),
  requireUserAccess,
  userController.updateUserSettings.bind(userController)
);

// User analytics routes
router.get(
  '/:id/statistics',
  validateParams(userSchemas.userIdParams),
  requireUserAccess,
  userController.getUserStatistics.bind(userController)
);

router.get(
  '/:id/activity-summary',
  validateParams(userSchemas.userIdParams),
  validateQuery(userSchemas.getUserActivitySummaryQuery),
  requireUserAccess,
  userController.getUserActivitySummary.bind(userController)
);

// Company analytics routes
router.get(
  '/analytics/company/:companyId',
  validateParams(userSchemas.companyIdParams),
  userController.getCompanyUserAnalytics.bind(userController)
);

// Bulk operations routes
router.put(
  '/bulk/update',
  validateRequest(userSchemas.bulkUpdateUsers),
  userController.bulkUpdateUsers.bind(userController)
);

router.get(
  '/export/company/:companyId',
  validateParams(userSchemas.companyIdParams),
  userController.exportUsers.bind(userController)
);

router.post(
  '/import',
  validateRequest(userSchemas.importUsers),
  userController.importUsers.bind(userController)
);

export default router;