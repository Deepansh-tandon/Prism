import {
  getTokenById,
  getTokenChart,
  searchTokens,
  getTokenPrices,
} from '../services/zerion/tokens.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/tokens/:id
 * Get token details
 */
export const getTokenController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Token ID is required', 400);
    }

    const token = await getTokenById(id);

    if (!token) {
      throw new AppError('Token not found', 404);
    }

    res.json({
      success: true,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tokens/:id/chart?period=1d
 * Get price chart for token
 */
export const getTokenChartController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = '1d' } = req.query;

    if (!id) {
      throw new AppError('Token ID is required', 400);
    }

    const chart = await getTokenChart(id, period);

    res.json({
      success: true,
      data: {
        chart,
        period,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tokens/search?q=ethereum
 * Search for tokens
 */
export const searchTokensController = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      throw new AppError('Search query is required', 400);
    }

    const tokens = await searchTokens(q, limit);

    res.json({
      success: true,
      data: {
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tokens/prices
 * Get live prices for multiple tokens by symbols
 * Body: { symbols: ['ETH', 'BTC', 'SOL'] }
 */
export const getLiveTokenPricesController = async (req, res, next) => {
  try {
    const { symbols } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      throw new AppError('symbols array is required', 400);
    }

    const prices = await getTokenPrices(symbols);

    res.json({
      success: true,
      data: {
        prices,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

