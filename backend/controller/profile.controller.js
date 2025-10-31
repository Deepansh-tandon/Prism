import { generateUserBio } from '../services/profile/bioGenerator.js';
import { analyzePortfolio } from '../services/analysis/analyzer.js';
import { generateAIAnalysis, generateAIBio } from '../services/ai/gemini.js';
import { getPortfolioData, getTransactionHistory } from '../services/zerion/client.js';
import { findSimilarWallets } from '../services/similarity/matcher.js';
import { subscribeToSimilarWallets } from '../services/zerion/subscriptions.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

/**
 * GET /api/profile/:address
 * Get user profile (bio, timeline, badges, stats)
 */
export const getProfile = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`👤 Fetching profile for ${address}`);

    const user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() },
      select: {
        address: true,
        ensName: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
        bioData: true,
        analysisData: true,
        createdAt: true,
        lastAnalyzed: true,
      },
    });

    if (!user) {
      return res.json({
        success: true,
        data: null,
        message: 'Profile not found. Please onboard first.',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/profile/onboard
 * Complete user onboarding (analysis + bio + similarity + AI enhancement)
 */
export const onboardUser = async (req, res, next) => {
  try {
    const { address, useAI = true } = req.body;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`🎯 Onboarding user: ${address}`);

    // Normalize address for database (lowercase)
    const normalizedAddress = address.toLowerCase();
    
    // Check if already onboarded
    const existing = await prisma.user.findUnique({
      where: { address: normalizedAddress },
    });

    if (existing && existing.bioData) {
      console.log('  ℹ️  User already onboarded, returning existing data');
      return res.json({
        success: true,
        data: existing,
        message: 'User already onboarded',
      });
    }

    // Step 1: Fetch portfolio and history (use original address format for API)
    console.log('  → Fetching portfolio data...');
    const portfolio = await getPortfolioData(address); // Keep original case
    const history = await getTransactionHistory(address, { limit: 100 }); // Max 100 per Zerion limit

    // Step 2: Run rule-based analysis
    console.log('  → Running analysis...');
    const ruleBasedAnalysis = await analyzePortfolio(address);

    // Step 3: Generate rule-based bio
    console.log('  → Generating bio...');
    const ruleBasedBio = await generateUserBio(address);

    // Step 4: AI enhancement (optional)
    let aiAnalysis = null;
    let aiBio = null;
    if (useAI) {
      console.log('  → Running AI enhancement...');
      aiAnalysis = await generateAIAnalysis(portfolio, ruleBasedAnalysis);
      aiBio = await generateAIBio(address, history, ruleBasedBio);
    }

    // Combine bio with AI enhancement
    const finalBio = {
      ...ruleBasedBio,
      ...(aiBio && { ai: aiBio }),
    };

    // Combine analysis with AI enhancement
    const finalAnalysis = {
      ...ruleBasedAnalysis,
      ...(aiAnalysis && { ai: aiAnalysis }),
    };

    // Step 5: Find similar wallets
    console.log('  → Finding similar wallets...');
    const similarWallets = await findSimilarWallets(address, ruleBasedAnalysis);

    // Step 6: Save to database (use normalized/lowercase address)
    console.log('  → Saving to database...');
    const user = await prisma.user.upsert({
      where: { address: normalizedAddress },
      update: {
        analysisData: finalAnalysis,
        bioData: finalBio,
        personalityType: ruleBasedAnalysis.personality,
        riskScore: ruleBasedAnalysis.riskScore,
        portfolioValue: portfolio.totalValue,
        portfolioData: portfolio,
        lastAnalyzed: new Date(),
      },
      create: {
        address: normalizedAddress,
        analysisData: finalAnalysis,
        bioData: finalBio,
        personalityType: ruleBasedAnalysis.personality,
        riskScore: ruleBasedAnalysis.riskScore,
        portfolioValue: portfolio.totalValue,
        portfolioData: portfolio,
      },
    });

    // Step 7: Store similarity edges
    if (similarWallets.length > 0) {
      console.log('  → Storing similarity data...');
      await Promise.all(
        similarWallets.map((similar) =>
          prisma.similarityEdge.upsert({
            where: {
              userId_similarAddress: {
                userId: user.id,
                similarAddress: similar.address,
              },
            },
            update: {
              score: similar.similarity,
            },
            create: {
              userId: user.id,
              similarAddress: similar.address,
              score: similar.similarity,
            },
          })
        )
      );
    }

    // Step 8: Subscribe to Zerion webhooks for similar wallets
    let subscriptionCount = 0;
    if (similarWallets.length > 0) {
      console.log('  → Creating Zerion subscriptions for real-time updates...');
      const subscriptions = await subscribeToSimilarWallets(similarWallets);
      subscriptionCount = subscriptions.length;
    }

    console.log(`✅ Onboarding complete for ${address} (${subscriptionCount} webhooks active)`);

    res.json({
      success: true,
      data: {
        address,
        analysis: finalAnalysis,
        profile: finalBio,
        similarWallets,
      },
    });
  } catch (error) {
    next(error);
  }
};

