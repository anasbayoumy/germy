import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { 
  authenticateToken, 
  requireUserAccess, 
  requireAdminOrSuperAdmin,
  requireOwnDataAccess,
  requireCompanyAdminOrSuperAdmin,
  requireUserManagementAccess
} from '../middleware/auth.middleware';
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
  requireCompanyAdminOrSuperAdmin, // Only admins can view all users
  userController.getUsers.bind(userController)
);

router.get(
  '/search',
  validateQuery(userSchemas.searchUsersQuery),
  requireCompanyAdminOrSuperAdmin, // Only admins can search users
  userController.searchUsers.bind(userController)
);

router.get(
  '/:id',
  validateParams(userSchemas.userIdParams),
  requireOwnDataAccess, // Users can only access their own data, admins can access company users
  userController.getUserById.bind(userController)
);

router.put(
  '/:id',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUser),
  requireOwnDataAccess, // Users can only update their own data, admins can update company users
  userController.updateUser.bind(userController)
);

router.patch(
  '/:id',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUser),
  requireOwnDataAccess, // Users can only update their own data, admins can update company users
  userController.updateUser.bind(userController)
);

router.patch(
  '/:id/deactivate',
  validateParams(userSchemas.userIdParams),
  requireUserManagementAccess, // Only admins can deactivate users
  userController.deactivateUser.bind(userController)
);

// User preferences routes
router.get(
  '/:id/preferences',
  validateParams(userSchemas.userIdParams),
  requireOwnDataAccess, // Users can only access their own preferences, admins can access company users
  userController.getUserPreferences.bind(userController)
);

router.put(
  '/:id/preferences',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUserPreferences),
  requireOwnDataAccess, // Users can only update their own preferences, admins can update company users
  userController.updateUserPreferences.bind(userController)
);

// User activities routes
router.get(
  '/:id/activities',
  validateParams(userSchemas.userIdParams),
  validateQuery(userSchemas.getUserActivitiesQuery),
  requireOwnDataAccess, // Users can only access their own activities, admins can access company users
  userController.getUserActivities.bind(userController)
);

// User settings routes
router.get(
  '/:id/settings',
  validateParams(userSchemas.userIdParams),
  requireOwnDataAccess, // Users can only access their own settings, admins can access company users
  userController.getUserSettings.bind(userController)
);

router.put(
  '/:id/settings',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.updateUserSettings),
  requireOwnDataAccess, // Users can only update their own settings, admins can update company users
  userController.updateUserSettings.bind(userController)
);

// User analytics routes
router.get(
  '/:id/statistics',
  validateParams(userSchemas.userIdParams),
  requireOwnDataAccess, // Users can only access their own statistics, admins can access company users
  userController.getUserStatistics.bind(userController)
);

router.get(
  '/:id/activity-summary',
  validateParams(userSchemas.userIdParams),
  validateQuery(userSchemas.getUserActivitySummaryQuery),
  requireOwnDataAccess, // Users can only access their own activity summary, admins can access company users
  userController.getUserActivitySummary.bind(userController)
);

// Company analytics routes
router.get(
  '/analytics/company/:companyId',
  validateParams(userSchemas.companyIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can access company analytics
  userController.getCompanyUserAnalytics.bind(userController)
);

// Bulk operations routes
router.put(
  '/bulk/update',
  validateRequest(userSchemas.bulkUpdateUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can perform bulk operations
  userController.bulkUpdateUsers.bind(userController)
);

router.get(
  '/export/company/:companyId',
  validateParams(userSchemas.companyIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can export users
  userController.exportUsers.bind(userController)
);

router.post(
  '/import',
  validateRequest(userSchemas.importUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can import users
  userController.importUsers.bind(userController)
);

// ===== NEW MISSING ROUTES =====

// User CRUD Operations
router.post(
  '/',
  validateRequest(userSchemas.createUser),
  requireCompanyAdminOrSuperAdmin, // Only admins can create users
  userController.createUser.bind(userController)
);

router.delete(
  '/:id',
  validateParams(userSchemas.userIdParams),
  requireUserManagementAccess, // Only admins can delete users
  userController.deleteUser.bind(userController)
);

router.patch(
  '/:id/activate',
  validateParams(userSchemas.userIdParams),
  requireUserManagementAccess, // Only admins can activate users
  userController.activateUser.bind(userController)
);

// Bulk Operations
router.post(
  '/bulk',
  validateRequest(userSchemas.bulkCreateUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can create multiple users
  userController.bulkCreateUsers.bind(userController)
);

router.delete(
  '/bulk',
  validateRequest(userSchemas.bulkDeleteUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can delete multiple users
  userController.bulkDeleteUsers.bind(userController)
);

router.patch(
  '/bulk/activate',
  validateRequest(userSchemas.bulkActivateUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can activate multiple users
  userController.bulkActivateUsers.bind(userController)
);

router.patch(
  '/bulk/deactivate',
  validateRequest(userSchemas.bulkDeactivateUsers),
  requireCompanyAdminOrSuperAdmin, // Only admins can deactivate multiple users
  userController.bulkDeactivateUsers.bind(userController)
);

// Activity Management
router.post(
  '/:id/activities',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.createUserActivity),
  requireOwnDataAccess, // Users can only create their own activities, admins can create for company users
  userController.createUserActivity.bind(userController)
);

router.put(
  '/:id/activities/:activityId',
  validateParams(userSchemas.activityIdParams),
  validateRequest(userSchemas.updateUserActivity),
  requireOwnDataAccess, // Users can only update their own activities, admins can update for company users
  userController.updateUserActivity.bind(userController)
);

router.delete(
  '/:id/activities/:activityId',
  validateParams(userSchemas.activityIdParams),
  requireOwnDataAccess, // Users can only delete their own activities, admins can delete for company users
  userController.deleteUserActivity.bind(userController)
);

router.get(
  '/:id/activities/:activityId',
  validateParams(userSchemas.activityIdParams),
  requireOwnDataAccess, // Users can only access their own activities, admins can access company users
  userController.getUserActivityById.bind(userController)
);

// Advanced Search
router.post(
  '/search/advanced',
  validateRequest(userSchemas.advancedSearch),
  requireCompanyAdminOrSuperAdmin, // Only admins can perform advanced search
  userController.advancedSearch.bind(userController)
);

// Saved Searches
router.post(
  '/search/save',
  validateRequest(userSchemas.saveSearch),
  requireCompanyAdminOrSuperAdmin, // Only admins can save searches
  userController.saveSearch.bind(userController)
);

router.get(
  '/search/saved',
  requireCompanyAdminOrSuperAdmin, // Only admins can access saved searches
  userController.getSavedSearches.bind(userController)
);

router.put(
  '/search/:searchId',
  validateParams(userSchemas.searchIdParams),
  validateRequest(userSchemas.updateSearch),
  requireCompanyAdminOrSuperAdmin, // Only admins can update saved searches
  userController.updateSavedSearch.bind(userController)
);

router.delete(
  '/search/:searchId',
  validateParams(userSchemas.searchIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can delete saved searches
  userController.deleteSavedSearch.bind(userController)
);

// Permission Management
router.get(
  '/:id/permissions',
  validateParams(userSchemas.userIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can manage permissions
  userController.getUserPermissions.bind(userController)
);

router.post(
  '/:id/permissions',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.userPermissions),
  requireCompanyAdminOrSuperAdmin, // Only admins can grant permissions
  userController.grantUserPermissions.bind(userController)
);

router.delete(
  '/:id/permissions',
  validateParams(userSchemas.userIdParams),
  validateRequest(userSchemas.userPermissions),
  requireCompanyAdminOrSuperAdmin, // Only admins can revoke permissions
  userController.revokeUserPermissions.bind(userController)
);

// Custom Reports
router.post(
  '/reports',
  validateRequest(userSchemas.customReport),
  requireCompanyAdminOrSuperAdmin, // Only admins can create reports
  userController.createCustomReport.bind(userController)
);

router.get(
  '/reports',
  requireCompanyAdminOrSuperAdmin, // Only admins can access reports
  userController.getCustomReports.bind(userController)
);

router.post(
  '/reports/:reportId/generate',
  validateParams(userSchemas.reportIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can generate reports
  userController.generateReport.bind(userController)
);

// Export by Role
router.get(
  '/export/role/:role',
  validateParams(userSchemas.exportByRole),
  requireCompanyAdminOrSuperAdmin, // Only admins can export by role
  userController.exportUsersByRole.bind(userController)
);

export default router;