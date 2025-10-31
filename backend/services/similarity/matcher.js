import { prisma } from '../../config/database.js';

/**
 * Find similar wallets based on portfolio characteristics
 */
export const findSimilarWallets = async (address, analysis) => {
  try {
    console.log(`🔍 Finding similar wallets for ${address}`);
    console.log(`  Personality: ${analysis.personality}`);
    console.log(`  Risk Score: ${analysis.riskScore}`);

    // Convert current portfolio to vector
    const currentVector = portfolioToVector(analysis.metrics);

    // Fetch all other users from database
    const allUsers = await prisma.user.findMany({
      where: {
        address: {
          not: address.toLowerCase(),
        },
        analysisData: {
          not: null,
        },
      },
      select: {
        address: true,
        analysisData: true,
        personalityType: true,
        riskScore: true,
        portfolioValue: true,
      },
    });

    if (allUsers.length === 0) {
      console.log('  ⚠️  No other users in database yet');
      return [];
    }

    // Calculate similarity scores
    const similarities = allUsers.map(user => {
      const userMetrics = user.analysisData?.metrics || {};
      const userVector = portfolioToVector(userMetrics);
      const score = calculateSimilarity(currentVector, userVector);

      return {
        address: user.address,
        similarity: score,
        personality: user.personalityType,
        riskScore: user.riskScore,
        portfolioValue: user.portfolioValue,
      };
    });

    // Sort by similarity score and take top 20
    const topSimilar = similarities
      .filter(s => s.similarity > 0.3) // Only keep reasonably similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20);

    console.log(`  ✅ Found ${topSimilar.length} similar wallets`);
    
    return topSimilar;
  } catch (error) {
    console.error('Similarity matching error:', error);
    return [];
  }
};

/**
 * Calculate cosine similarity between two portfolio vectors
 */
export const calculateSimilarity = (vectorA, vectorB) => {
  // Cosine similarity formula
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let key in vectorA) {
    if (vectorB.hasOwnProperty(key)) {
      dotProduct += vectorA[key] * vectorB[key];
    }
    magnitudeA += vectorA[key] * vectorA[key];
  }

  for (let key in vectorB) {
    magnitudeB += vectorB[key] * vectorB[key];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Convert portfolio metrics to vector for similarity comparison
 */
export const portfolioToVector = (metrics) => {
  const { allocations, chainCount, protocolCount, concentration } = metrics;

  return {
    stablecoins: allocations.stablecoins || 0,
    bluechip: allocations.bluechip || 0,
    defi: allocations.defi || 0,
    chainDiversity: chainCount / 10, // Normalize
    protocolDiversity: protocolCount / 15, // Normalize
    concentration: concentration,
  };
};

