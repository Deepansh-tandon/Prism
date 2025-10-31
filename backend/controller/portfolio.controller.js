import { getPortfolioData, getTransactionHistory } from '../services/zerion/client.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/portfolio/:address
 * Fetch current portfolio holdings and value
 */
export const getPortfolio = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`📊 Fetching portfolio for ${address}`);

    const portfolio = await getPortfolioData(address);

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/portfolio/:address/history
 * Fetch transaction history
 */
export const getPortfolioHistory = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`📜 Fetching history for ${address}`);

    const history = await getTransactionHistory(address, { limit, offset });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

