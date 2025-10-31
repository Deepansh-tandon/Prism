import { compareWithSimilar } from '../services/analysis/comparison.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/comparison/:address
 * Compare user's portfolio with similar wallets
 */
export const getPortfolioComparison = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`📊 Comparing portfolio for ${address}`);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: {
        address: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
        analysisData: true,
        portfolioData: true,
      },
    });

    if (!user || !user.analysisData) {
      throw new AppError('User not found or not analyzed yet. Please complete onboarding first.', 404);
    }

    // Get similar wallets with their data
    const similarities = await prisma.similarityEdge.findMany({
      where: { userId: user.id },
      orderBy: { score: 'desc' },
      take: 20,
    });

    if (similarities.length === 0) {
      return res.json({
        success: true,
        data: {
          comparison: null,
          insights: [],
          message: 'No similar wallets found for comparison',
        },
      });
    }

    // Fetch similar wallets' data
    const similarAddresses = similarities.map(s => s.similarAddress);
    const similarWallets = await prisma.user.findMany({
      where: {
        address: { in: similarAddresses },
      },
      select: {
        address: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
        analysisData: true,
        portfolioData: true,
      },
    });

    // Combine with similarity scores
    const similarWithScores = similarWallets.map(wallet => {
      const sim = similarities.find(s => s.similarAddress === wallet.address);
      return {
        ...wallet,
        similarity: sim?.score || 0,
      };
    });

    // Prepare user metrics
    const userMetrics = {
      totalValue: user.portfolioValue || 0,
      riskScore: user.riskScore || 5,
      chainCount: user.analysisData?.metrics?.chainCount || 0,
      positionCount: user.analysisData?.metrics?.positionCount || 0,
      txCount: user.analysisData?.metrics?.txCount || 0,
      allocations: user.analysisData?.metrics?.allocations || {},
    };

    // Compare
    const comparisonResult = compareWithSimilar(userMetrics, similarWithScores);

    res.json({
      success: true,
      data: {
        ...comparisonResult,
        user: {
          address: user.address,
          personality: user.personalityType,
          metrics: userMetrics,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

