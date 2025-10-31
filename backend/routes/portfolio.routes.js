import express from 'express';
import {
  getPortfolio,
  getPortfolioHistory,
} from '../controller/portfolio.controller.js';

const router = express.Router();

// GET /api/portfolio/:address - Get current portfolio
router.get('/:address', getPortfolio);

// GET /api/portfolio/:address/history - Get portfolio history/transactions
router.get('/:address/history', getPortfolioHistory);

export default router;

