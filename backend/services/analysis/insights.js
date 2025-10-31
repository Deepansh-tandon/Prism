/**
 * Generate insights: strengths, weaknesses, recommendations
 */
export const generateInsights = (metrics, personality, riskScore) => {
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  const { allocations, chainCount, protocolCount, concentration } = metrics;

  // Analyze strengths
  if (allocations.bluechip > 0.5) {
    strengths.push('Strong blue-chip allocation provides stability');
  }

  if (chainCount >= 3) {
    strengths.push('Good multi-chain diversification reduces platform risk');
  }

  if (protocolCount >= 5) {
    strengths.push('Active DeFi engagement across multiple protocols');
  }

  if (concentration < 0.4) {
    strengths.push('Well-diversified portfolio reduces concentration risk');
  }

  if (allocations.stablecoins > 0.1 && allocations.stablecoins < 0.3) {
    strengths.push('Healthy stablecoin buffer for opportunities');
  }

  // Analyze weaknesses
  if (allocations.stablecoins > 0.5) {
    weaknesses.push('High stablecoin allocation limits upside potential');
  }

  if (allocations.bluechip < 0.2) {
    weaknesses.push('Low exposure to established assets increases risk');
  }

  if (chainCount === 1) {
    weaknesses.push('Single-chain exposure creates platform risk');
  }

  if (concentration > 0.7) {
    weaknesses.push('High concentration in few positions');
  }

  if (protocolCount > 12) {
    weaknesses.push('Many protocols increase complexity and management burden');
  }

  // Generate recommendations
  if (allocations.stablecoins > 0.4) {
    recommendations.push('Consider reducing stablecoin allocation to 15-25% to capture more upside');
  }

  if (chainCount < 3) {
    recommendations.push('Explore emerging L2s like Base, Arbitrum, or Optimism');
  }

  if (allocations.bluechip < 0.3) {
    recommendations.push('Increase ETH/BTC allocation for portfolio stability');
  }

  if (concentration > 0.6) {
    recommendations.push('Diversify holdings to reduce single-position risk');
  }

  if (allocations.defi === 0 && protocolCount < 3) {
    recommendations.push('Consider DeFi yield opportunities (Aave, Compound) for passive income');
  }

  // Fallback if empty
  if (strengths.length === 0) {
    strengths.push('Active crypto participant');
  }

  if (recommendations.length === 0) {
    recommendations.push('Portfolio looks balanced - maintain current strategy');
  }

  return {
    strengths: strengths.slice(0, 4), // Top 4
    weaknesses: weaknesses.slice(0, 3), // Top 3
    recommendations: recommendations.slice(0, 3), // Top 3
  };
};

