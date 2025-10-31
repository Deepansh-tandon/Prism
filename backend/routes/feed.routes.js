import express from 'express';
import {
  getFeed,
  getRecentActivity,
} from '../controller/feed.controller.js';

const router = express.Router();

// GET /api/feed/:address - Get personalized activity feed
router.get('/:address', getFeed);

// GET /api/feed/:address/recent - Get recent activity (for initial load)
router.get('/:address/recent', getRecentActivity);

export default router;

