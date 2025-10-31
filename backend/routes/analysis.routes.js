import express from 'express';
import {
  getAnalysis,
  triggerAnalysis,
} from '../controller/analysis.controller.js';

const router = express.Router();

// GET /api/analysis/:address - Get cached analysis
router.get('/:address', getAnalysis);

// POST /api/analysis/:address - Trigger new analysis
router.post('/:address', triggerAnalysis);

export default router;

