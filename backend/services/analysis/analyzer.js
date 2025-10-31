import { getPortfolioData, getTransactionHistory } from '../zerion/client.js';
import { calculatePersonality } from './personality.js';
import { calculateRiskScore } from './risk.js';
import { generateInsights } from './insights.js';

/**
 * Main analysis function
 * Analyzes a wallet's portfolio and returns comprehensive insights
 */
export const analyzePortfolio = async (address) => {
  try {
    console.log(`🧠 Starting analysis for ${address}`);

    // Fetch portfolio and history
    const portfolio = await getPortfolioData(address);
    const history = await getTransactionHistory(address, { limit: 100 });

    // Calculate metrics
    const metrics = calculateMetrics(portfolio, history);

    // Determine personality type
    const personality = calculatePersonality(metrics);

    // Calculate risk score
    const riskScore = calculateRiskScore(metrics);

    // Generate insights (strengths, weaknesses, recommendations)
    const insights = generateInsights(metrics, personality, riskScore);

    return {
      address,
      personality,
      riskScore,
      metrics,
      ...insights,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
};

/**
 * Calculate portfolio metrics
 */
function calculateMetrics(portfolio, history) {
  const positions = portfolio.positions || [];
  const totalValue = portfolio.totalValue || 0;

  // Calculate token allocations
  const allocations = calculateAllocations(positions, totalValue);

  // Chain diversity
  const chains = portfolio.chains || [];
  const chainCount = chains.length;

  // Protocol usage (estimate from positions)
  const protocols = extractProtocols(positions);
  const protocolCount = protocols.length;

  // Transaction frequency
  const txCount = history.transactions?.length || 0;
  const avgTxPerMonth = calculateTxFrequency(history.transactions);

  // Position concentration (Herfindahl index)
  const concentration = calculateConcentration(positions, totalValue);

  return {
    totalValue,
    allocations,
    chainCount,
    chains,
    protocolCount,
    protocols,
    txCount,
    avgTxPerMonth,
    concentration,
    positionCount: positions.length,
  };
}

/**
 * Calculate token category allocations
 */
function calculateAllocations(positions, totalValue) {
  if (totalValue === 0) return {};

  const categories = {
    stablecoins: 0,
    bluechip: 0, // ETH, BTC, major L1s
    defi: 0,
    memecoins: 0,
    nft: 0,
    other: 0,
  };

  const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];
  const bluechips = ['ETH', 'WETH', 'BTC', 'WBTC', 'BNB', 'SOL', 'MATIC', 'AVAX'];
  const defiTokens = ['AAVE', 'UNI', 'COMP', 'CRV', 'SNX', 'MKR', 'LDO', 'RPL'];

  positions.forEach(position => {
    const symbol = position.symbol?.toUpperCase() || '';
    const value = position.value || 0;
    const percentage = totalValue > 0 ? (value / totalValue) : 0;

    if (stablecoins.includes(symbol)) {
      categories.stablecoins += percentage;
    } else if (bluechips.includes(symbol)) {
      categories.bluechip += percentage;
    } else if (defiTokens.includes(symbol)) {
      categories.defi += percentage;
    } else {
      categories.other += percentage;
    }
  });

  return categories;
}

/**
 * Extract protocols from positions
 */
function extractProtocols(positions) {
  const protocols = new Set();

  positions.forEach(position => {
    if (position.protocol) {
      protocols.add(position.protocol);
    }
  });

  return Array.from(protocols);
}

/**
 * Calculate transaction frequency (avg per month)
 */
function calculateTxFrequency(transactions) {
  if (!transactions || transactions.length === 0) return 0;

  const oldest = transactions[transactions.length - 1];
  const newest = transactions[0];

  if (!oldest?.timestamp || !newest?.timestamp) return 0;

  const oldestDate = new Date(oldest.timestamp);
  const newestDate = new Date(newest.timestamp);
  const monthsDiff = (newestDate - oldestDate) / (1000 * 60 * 60 * 24 * 30);

  return monthsDiff > 0 ? transactions.length / monthsDiff : 0;
}

/**
 * Calculate portfolio concentration (Herfindahl Index)
 * 0 = perfectly diversified, 1 = completely concentrated
 */
function calculateConcentration(positions, totalValue) {
  if (totalValue === 0) return 0;

  let sum = 0;
  positions.forEach(position => {
    const share = (position.value || 0) / totalValue;
    sum += share * share;
  });

  return sum;
}

