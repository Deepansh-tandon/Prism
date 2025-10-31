import express from 'express';
import {
  getTokenController,
  getTokenChartController,
  searchTokensController,
  getLiveTokenPricesController,
} from '../controller/token.controller.js';

const router = express.Router();

// GET /api/tokens/:id - Get token details
router.get('/:id', getTokenController);

// GET /api/tokens/:id/chart - Get price chart
router.get('/:id/chart', getTokenChartController);

// GET /api/tokens/search?q=ETH - Search tokens
router.get('/search', searchTokensController);

// POST /api/tokens/prices - Get live prices for multiple tokens
router.post('/prices', getLiveTokenPricesController);

export default router;

