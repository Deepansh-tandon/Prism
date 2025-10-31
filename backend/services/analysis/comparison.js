/**
 * Portfolio Comparison Service
 * Compare user's portfolio with similar wallets
 */

/**
 * Compare user portfolio with similar wallets
 */
export const compareWithSimilar = (userMetrics, similarWallets) => {
  if (!similarWallets || similarWallets.length === 0) {
    return {
      summary: 'No similar wallets to compare',
      metrics: {},
      positioning: 'neutral',
    };
  }

  // Calculate averages from similar wallets
  const avgPortfolioValue = calculateAverage(similarWallets, 'portfolioValue');
  const avgRiskScore = calculateAverage(similarWallets, 'riskScore');
  
  // Extract metrics from portfolioData if available
  const similarMetrics = similarWallets
    .map(w => w.analysisData?.metrics)
    .filter(Boolean);
  
  const avgChainCount = calculateAverage(similarMetrics, 'chainCount');
  const avgPositionCount = calculateAverage(similarMetrics, 'positionCount');
  const avgTxCount = calculateAverage(similarMetrics, 'txCount');

  // Compare user with averages
  const comparison = {
    portfolioValue: {
      user: userMetrics.totalValue,
      average: avgPortfolioValue,
      diff: userMetrics.totalValue - avgPortfolioValue,
      diffPercent: calculatePercentDiff(userMetrics.totalValue, avgPortfolioValue),
      position: getPosition(userMetrics.totalValue, avgPortfolioValue),
    },
    riskScore: {
      user: userMetrics.riskScore,
      average: avgRiskScore,
      diff: userMetrics.riskScore - avgRiskScore,
      position: getRiskPosition(userMetrics.riskScore, avgRiskScore),
    },
    diversity: {
      chains: {
        user: userMetrics.chainCount,
        average: avgChainCount,
        diff: userMetrics.chainCount - avgChainCount,
        position: getPosition(userMetrics.chainCount, avgChainCount),
      },
      positions: {
        user: userMetrics.positionCount,
        average: avgPositionCount,
        diff: userMetrics.positionCount - avgPositionCount,
        position: getPosition(userMetrics.positionCount, avgPositionCount),
      },
    },
    activity: {
      transactions: {
        user: userMetrics.txCount,
        average: avgTxCount,
        diff: userMetrics.txCount - avgTxCount,
        position: getPosition(userMetrics.txCount, avgTxCount),
      },
    },
  };

  // Generate insights
  const insights = generateComparisonInsights(comparison, userMetrics);

  return {
    comparison,
    insights,
    similarCount: similarWallets.length,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Calculate average of a specific field
 */
function calculateAverage(array, field) {
  if (!array || array.length === 0) return 0;
  
  const values = array.map(item => {
    if (typeof item === 'object' && item !== null) {
      return item[field] || 0;
    }
    return 0;
  }).filter(v => v !== null && !isNaN(v));
  
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Calculate percentage difference
 */
function calculatePercentDiff(value, average) {
  if (average === 0) return value > 0 ? 100 : 0;
  return Math.round(((value - average) / average) * 100);
}

/**
 * Get position relative to average
 */
function getPosition(value, average) {
  const diff = calculatePercentDiff(value, average);
  
  if (diff > 20) return 'significantly_above';
  if (diff > 5) return 'above';
  if (diff < -20) return 'significantly_below';
  if (diff < -5) return 'below';
  return 'average';
}

/**
 * Get risk position
 */
function getRiskPosition(userRisk, avgRisk) {
  const diff = userRisk - avgRisk;
  
  if (diff > 2) return 'more_aggressive';
  if (diff > 0.5) return 'slightly_aggressive';
  if (diff < -2) return 'more_conservative';
  if (diff < -0.5) return 'slightly_conservative';
  return 'similar';
}

/**
 * Generate comparison insights
 */
function generateComparisonInsights(comparison, userMetrics) {
  const insights = [];

  // Portfolio value insights
  const pvPos = comparison.portfolioValue.position;
  if (pvPos === 'significantly_above') {
    insights.push({
      type: 'strength',
      category: 'portfolio_value',
      message: `Your portfolio value is ${Math.abs(comparison.portfolioValue.diffPercent)}% above similar traders`,
      icon: '📈',
    });
  } else if (pvPos === 'significantly_below') {
    insights.push({
      type: 'opportunity',
      category: 'portfolio_value',
      message: `Similar traders have ${Math.abs(comparison.portfolioValue.diffPercent)}% larger portfolios on average`,
      icon: '💡',
    });
  }

  // Risk insights
  const riskPos = comparison.riskScore.position;
  if (riskPos === 'more_aggressive') {
    insights.push({
      type: 'warning',
      category: 'risk',
      message: `You're taking more risk than similar traders (${comparison.riskScore.user} vs ${comparison.riskScore.average.toFixed(1)})`,
      icon: '⚠️',
    });
  } else if (riskPos === 'more_conservative') {
    insights.push({
      type: 'strength',
      category: 'risk',
      message: `You're more conservative than similar traders - lower risk profile`,
      icon: '🛡️',
    });
  }

  // Diversity insights
  const chainPos = comparison.diversity.chains.position;
  if (chainPos === 'significantly_above') {
    insights.push({
      type: 'strength',
      category: 'diversity',
      message: `You're more diversified across chains than similar traders (${comparison.diversity.chains.user} vs ${comparison.diversity.chains.average.toFixed(1)})`,
      icon: '🌐',
    });
  } else if (chainPos === 'significantly_below') {
    insights.push({
      type: 'opportunity',
      category: 'diversity',
      message: `Consider expanding to more chains - similar traders use ${comparison.diversity.chains.average.toFixed(0)} chains on average`,
      icon: '🔗',
    });
  }

  // Activity insights
  const activityPos = comparison.activity.transactions.position;
  if (activityPos === 'significantly_above') {
    insights.push({
      type: 'strength',
      category: 'activity',
      message: `You're ${Math.abs(comparison.activity.transactions.diffPercent)}% more active than similar traders`,
      icon: '⚡',
    });
  } else if (activityPos === 'significantly_below') {
    insights.push({
      type: 'info',
      category: 'activity',
      message: `Similar traders are ${Math.abs(comparison.activity.transactions.diffPercent)}% more active on-chain`,
      icon: '📊',
    });
  }

  // Fallback if no insights
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      category: 'general',
      message: 'Your portfolio metrics are similar to comparable traders',
      icon: '✅',
    });
  }

  return insights;
}

