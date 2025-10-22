import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get available plans (no auth required)
router.get('/plans', subscriptionController.getAvailablePlans.bind(subscriptionController));

// Get company subscription (requires auth)
router.get('/company/:companyId', authenticateToken, subscriptionController.getCompanySubscription.bind(subscriptionController));

// Check employee limit (requires auth)
router.get('/limit/:companyId', authenticateToken, subscriptionController.checkEmployeeLimit.bind(subscriptionController));

// Check if upgrade needed (requires auth)
router.get('/upgrade/:companyId', authenticateToken, subscriptionController.checkUpgradeNeeded.bind(subscriptionController));

// Get enterprise contact (no auth required)
router.get('/enterprise/contact', subscriptionController.getEnterpriseContact.bind(subscriptionController));

// Validate plan upgrade (requires auth)
router.post('/validate-upgrade/:companyId', authenticateToken, subscriptionController.validatePlanUpgrade.bind(subscriptionController));

// Update employee count (requires auth)
router.post('/update-count/:companyId', authenticateToken, subscriptionController.updateEmployeeCount.bind(subscriptionController));

export default router;
