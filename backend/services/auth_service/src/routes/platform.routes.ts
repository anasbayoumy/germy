import express from 'express';
import { PlatformController } from '../controllers/platform.controller';
import { authenticateToken, requirePlatformAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createCompanySchema, updateCompanySchema } from '../schemas/platform.schemas';

const router = express.Router();
const platformController = new PlatformController();

// All platform routes require platform admin authentication
router.use(authenticateToken);
router.use(requirePlatformAdmin);

// Company management
router.get('/companies', platformController.getCompanies.bind(platformController));
router.post('/companies', validateRequest(createCompanySchema), platformController.createCompany.bind(platformController));
router.put('/companies/:id', validateRequest(updateCompanySchema), platformController.updateCompany.bind(platformController));

// Subscription management
router.get('/subscriptions', platformController.getSubscriptions.bind(platformController));

export default router;
