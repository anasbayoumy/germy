import { Router } from 'express';
import { trialController } from '../controllers/trial.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Trial eligibility check (no auth required)
router.get('/eligibility/:domain', trialController.checkTrialEligibility.bind(trialController));

// Start trial (no auth required - for new companies)
router.post('/start', trialController.startTrial.bind(trialController));

// Get trial status (requires auth)
router.get('/status/:companyId', authenticateToken, trialController.getTrialStatus.bind(trialController));

// Convert trial to paid (requires auth)
router.post('/convert', authenticateToken, trialController.convertTrialToPaid.bind(trialController));

export default router;
