import express from 'express';
import {
  getProfile,
  onboardUser,
} from '../controller/profile.controller.js';

const router = express.Router();

// GET /api/profile/:address - Get user profile (bio, timeline, badges)
router.get('/:address', getProfile);

// POST /api/profile/onboard - First-time user onboarding
router.post('/onboard', onboardUser);

export default router;

