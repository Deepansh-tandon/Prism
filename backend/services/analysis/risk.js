/**
 * Calculate risk score (1-10)
 * 1 = Very low risk (conservative)
 * 10 = Very high risk (degen)
 */
export const calculateRiskScore = (metrics) => {
  const {
    allocations,
    concentration,
    chainCount,
    protocolCount,
    totalValue,
    positionCount,
  } = metrics;

  // Handle edge case: empty or very small portfolio
  if (totalValue === 0 || positionCount === 0) {
    return 5; // Neutral score for empty portfolios
  }

  let score = 5; // Start at medium risk

  // Check if allocations is empty (portfolio value was 0)
  const hasAllocations = Object.values(allocations).some(v => v > 0);
  
  if (!hasAllocations) {
    // Fallback scoring based on other metrics
    if (chainCount >= 3) score -= 1; // Diversification is good
    if (chainCount >= 5) score += 1; // But too many might be risky
    if (positionCount < 3) score += 1; // Few positions = concentrated
    if (positionCount > 10) score += 1; // Too many = complexity
    return Math.max(1, Math.min(10, Math.round(score)));
  }

  // Stablecoin allocation (lower = higher risk)
  if (allocations.stablecoins > 0.5) {
    score -= 2;
  } else if (allocations.stablecoins < 0.1) {
    score += 1;
  }

  // Blue-chip allocation (higher = lower risk)
  if (allocations.bluechip > 0.6) {
    score -= 2;
  } else if (allocations.bluechip < 0.2) {
    score += 2;
  }

  // Memecoin/other allocation (higher = higher risk)
  if (allocations.other > 0.5) {
    score += 2;
  }

  // Portfolio concentration (higher = higher risk)
  if (concentration > 0.7) {
    score += 2;
  } else if (concentration < 0.3) {
    score -= 1;
  }

  // Chain diversification (more chains = slightly higher risk)
  if (chainCount > 5) {
    score += 1;
  } else if (chainCount === 1) {
    score += 1; // Single chain = platform risk
  }

  // Protocol count (many protocols = higher complexity risk)
  if (protocolCount > 10) {
    score += 1;
  } else if (protocolCount >= 5) {
    score += 0.5; // Moderate DeFi activity
  }

  // Clamp between 1-10
  return Math.max(1, Math.min(10, Math.round(score)));
};

