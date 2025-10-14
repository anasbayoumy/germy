import express from 'express';

const router = express.Router();

// Placeholder routes for fraud detection functionality
// These will be implemented later

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Fraud detection service is running',
    data: {
      status: 'active',
      version: '1.0.0',
      capabilities: ['pattern_analysis', 'risk_scoring', 'real_time_monitoring']
    }
  });
});

export default router;
