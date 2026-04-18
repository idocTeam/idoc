import express from 'express';
import os from 'os';

const router = express.Router();

/**
 * @desc    Check service health
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Symptom Service is healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    platform: os.platform()
  });
});

export default router;
