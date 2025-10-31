import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/feed/:address
 * Get personalized activity feed from similar wallets
 */
export const getFeed = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`📡 Fetching feed for ${address}`);

    // Get user to access their similar wallets
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        similarWallets: {
          take: 20,
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!user || !user.similarWallets.length) {
      return res.json({
        success: true,
        data: {
          activities: [],
          hasMore: false,
        },
        message: 'No similar wallets found. Complete onboarding first.',
      });
    }

    // Get addresses of similar wallets
    const similarAddresses = user.similarWallets.map((edge) => edge.similarAddress);

    // Fetch activities from similar wallets
    const activities = await prisma.activity.findMany({
      where: {
        address: { in: similarAddresses },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Check if there are more
    const total = await prisma.activity.count({
      where: {
        address: { in: similarAddresses },
      },
    });

    res.json({
      success: true,
      data: {
        activities,
        hasMore: total > parseInt(offset) + parseInt(limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/feed/:address/recent
 * Get recent activity for initial feed load
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    // Get user's similar wallets
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      include: {
        similarWallets: {
          take: 10,
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!user || !user.similarWallets.length) {
      return res.json({
        success: true,
        data: { activities: [] },
      });
    }

    const similarAddresses = user.similarWallets.map((edge) => edge.similarAddress);

    // Get most recent 10 activities
    const activities = await prisma.activity.findMany({
      where: {
        address: { in: similarAddresses },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
};

