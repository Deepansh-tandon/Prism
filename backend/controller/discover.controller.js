import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/discover/similar/:address
 * Get similar wallets for a given address
 */
export const getSimilarWallets = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 10 } = req.query;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`🔍 Finding similar wallets for ${address}`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!user) {
      return res.json({
        success: true,
        data: { similar: [] },
        message: 'User not found. Please onboard first.',
      });
    }

    // Get similarity edges with user details
    const similarities = await prisma.similarityEdge.findMany({
      where: { userId: user.id },
      orderBy: { score: 'desc' },
      take: parseInt(limit),
    });

    // Fetch details for similar addresses
    const similarAddresses = similarities.map((s) => s.similarAddress);
    const similarUsers = await prisma.user.findMany({
      where: {
        address: { in: similarAddresses },
      },
      select: {
        address: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
        ensName: true,
      },
    });

    // Combine with similarity scores
    const result = similarities.map((sim) => {
      const userInfo = similarUsers.find((u) => u.address === sim.similarAddress);
      return {
        ...userInfo,
        similarity: sim.score,
      };
    });

    res.json({
      success: true,
      data: {
        similar: result,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/discover
 * Browse/search wallets with filters
 */
export const discoverWallets = async (req, res, next) => {
  try {
    const {
      personality,
      minRiskScore,
      maxRiskScore,
      limit = 20,
      offset = 0,
    } = req.query;

    console.log('🔍 Discovering wallets with filters:', {
      personality,
      minRiskScore,
      maxRiskScore,
    });

    // Build where clause
    const where = {};
    if (personality) {
      where.personalityType = personality;
    }
    if (minRiskScore || maxRiskScore) {
      where.riskScore = {};
      if (minRiskScore) where.riskScore.gte = parseInt(minRiskScore);
      if (maxRiskScore) where.riskScore.lte = parseInt(maxRiskScore);
    }

    // Fetch wallets
    const wallets = await prisma.user.findMany({
      where,
      select: {
        address: true,
        ensName: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
        lastAnalyzed: true,
      },
      orderBy: { portfolioValue: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    // Get total count
    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: {
        wallets,
        hasMore: total > parseInt(offset) + parseInt(limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

