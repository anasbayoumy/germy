import express from 'express';
import { AIController } from '../controllers/ai.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { aiSchemas } from '../schemas/ai.schemas';

const router = express.Router();
const aiController = new AIController();

// ===========================================
// AI SERVICE ROUTES
// ===========================================

// Health check
router.get('/health', aiController.healthCheck.bind(aiController));

// Model information
router.get('/model-info', aiController.getModelInfo.bind(aiController));

// Face encoding (called by Auth Service)
router.post(
  '/encode-face',
  validateRequest(aiSchemas.encodeFaceSchema),
  aiController.encodeFace.bind(aiController)
);

// Face comparison (called by Attendance Service)
router.post(
  '/compare-faces',
  validateRequest(aiSchemas.compareFacesSchema),
  aiController.compareFaces.bind(aiController)
);

// Fraud analysis (called by Attendance Service)
router.post(
  '/analyze-fraud',
  validateRequest(aiSchemas.analyzeFraudSchema),
  aiController.analyzeFraud.bind(aiController)
);

export default router;
