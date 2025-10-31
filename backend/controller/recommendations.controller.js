import { generateAIRecommendations } from '../services/ai/recommendations.js';
import { compareWithSimilar } from '../services/analysis/comparison.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/recommendations/:address
 * Get AI-powered trading recommendations based on personality and portfolio
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`💡 Generating recommendations for ${address}`);

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

    // Get comparison data for context
    let comparisonData = null;
    try {
      const similarities = await prisma.similarityEdge.findMany({
        where: { userId: user.id },
        orderBy: { score: 'desc' },
        take: 10,
      });

      if (similarities.length > 0) {
        const similarAddresses = similarities.map(s => s.similarAddress);
        const similarWallets = await prisma.user.findMany({
          where: { address: { in: similarAddresses } },
          select: {
            address: true,
            riskScore: true,
            portfolioValue: true,
            analysisData: true,
          },
        });

        const userMetrics = {
          totalValue: user.portfolioValue || 0,
          riskScore: user.riskScore || 5,
          chainCount: user.analysisData?.metrics?.chainCount || 0,
          positionCount: user.analysisData?.metrics?.positionCount || 0,
          txCount: user.analysisData?.metrics?.txCount || 0,
        };

        comparisonData = compareWithSimilar(userMetrics, similarWallets);
      }
    } catch (error) {
      console.warn('Could not fetch comparison data:', error.message);
    }

    // Generate AI recommendations
    const recommendations = await generateAIRecommendations(
      user.analysisData,
      user.portfolioData,
      comparisonData
    );

    res.json({
      success: true,
      data: {
        ...recommendations,
        user: {
          address: user.address,
          personality: user.personalityType,
          riskScore: user.riskScore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

