import { analyzePortfolio } from '../services/analysis/analyzer.js';
import { generateAIAnalysis } from '../services/ai/gemini.js';
import { getPortfolioData } from '../services/zerion/client.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/analysis/:address
 * Get cached analysis or return null if not analyzed yet
 */
export const getAnalysis = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: {
        analysisData: true,
        personalityType: true,
        riskScore: true,
        lastAnalyzed: true,
      },
    });

    if (!user || !user.analysisData) {
      return res.json({
        success: true,
        data: null,
        message: 'Analysis not found. Please trigger analysis first.',
      });
    }

    res.json({
      success: true,
      data: {
        address,
        personalityType: user.personalityType,
        riskScore: user.riskScore,
        analysis: user.analysisData,
        lastAnalyzed: user.lastAnalyzed,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/analysis/:address
 * Trigger new portfolio analysis (rule-based + AI enhancement)
 */
export const triggerAnalysis = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { useAI = true } = req.body;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`🧠 Analyzing portfolio for ${address}`);

    // Get portfolio data
    const portfolio = await getPortfolioData(address);

    // Run rule-based analysis
    const ruleBasedAnalysis = await analyzePortfolio(address);

    // Optionally enhance with AI
    let aiEnhancement = null;
    if (useAI) {
      console.log('  → Running AI enhancement...');
      aiEnhancement = await generateAIAnalysis(portfolio, ruleBasedAnalysis);
    }

    // Combine results
    const finalAnalysis = {
      ...ruleBasedAnalysis,
      ...(aiEnhancement && { ai: aiEnhancement }),
    };

    // Save to database
    await prisma.user.upsert({
      where: { address: address.toLowerCase() },
      update: {
        analysisData: finalAnalysis,
        personalityType: ruleBasedAnalysis.personality,
        riskScore: ruleBasedAnalysis.riskScore,
        portfolioValue: portfolio.totalValue,
        portfolioData: portfolio,
        lastAnalyzed: new Date(),
      },
      create: {
        address: address.toLowerCase(),
        analysisData: finalAnalysis,
        personalityType: ruleBasedAnalysis.personality,
        riskScore: ruleBasedAnalysis.riskScore,
        portfolioValue: portfolio.totalValue,
        portfolioData: portfolio,
      },
    });

    res.json({
      success: true,
      data: finalAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

