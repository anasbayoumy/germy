import express from 'express';

const router = express.Router();

// Placeholder routes for ArcFace functionality
// These will be implemented later when we add the actual ArcFace model

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'ArcFace service is running',
    data: {
      status: 'active',
      version: '1.0.0',
      capabilities: ['face_encoding', 'face_comparison', 'quality_assessment']
    }
  });
});

export default router;
