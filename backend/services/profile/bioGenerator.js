import { getTransactionHistory } from '../zerion/client.js';

/**
 * Generate user bio/profile from wallet history
 */
export const generateUserBio = async (address) => {
  try {
    const history = await getTransactionHistory(address, { limit: 200 });
    const transactions = history.transactions || [];

    console.log(`📊 Bio generation: ${transactions.length} transactions fetched`);
    
    // Log first and last transaction for debugging
    if (transactions.length > 0) {
      const firstTx = transactions[transactions.length - 1];
      const lastTx = transactions[0];
      console.log('🔍 Transaction date fields available:', Object.keys(firstTx?.attributes || {}));
      console.log(`📅 Oldest tx date: ${firstTx?.attributes?.mined_at || firstTx?.attributes?.timestamp || 'N/A'}`);
      console.log(`📅 Newest tx date: ${lastTx?.attributes?.mined_at || lastTx?.attributes?.timestamp || 'N/A'}`);
    }

    // Calculate stats first
    const stats = calculateStats(transactions);

    // Extract timeline milestones
    const timeline = extractTimeline(transactions);

    // Assign achievement badges (needs stats)
    const badges = assignBadges(transactions, timeline, stats);

    // Generate tagline (needs badges and stats)
    const tagline = generateTagline(stats, badges, transactions);

    return {
      tagline,
      timeline,
      badges,
      stats,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Bio generation error:', error);
    // Return minimal bio on error
    return {
      tagline: 'Crypto enthusiast',
      timeline: [],
      badges: [],
      stats: {},
    };
  }
};

/**
 * Extract key moments from transaction history
 */
function extractTimeline(transactions) {
  if (!transactions || transactions.length === 0) return [];

  const timeline = [];

  // First transaction (crypto journey start)
  const firstTx = transactions[transactions.length - 1];
  const firstTxDate = firstTx?.attributes?.mined_at 
    || firstTx?.attributes?.timestamp 
    || firstTx?.timestamp;
    
  if (firstTxDate) {
    const date = new Date(firstTxDate);
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    timeline.push({
      date: date.toISOString(),
      label: `Started on-chain journey`,
      description: `First transaction in ${month}`,
      icon: '🚀',
    });
    
    // Add context for early joiners
    if (year <= 2020) {
      timeline.push({
        date: new Date(year, 0, 1).toISOString(),
        label: 'Early crypto pioneer',
        description: `Active in the pre-2021 era`,
        icon: '🏆',
      });
    }
  }

  // Detect major milestones
  const milestones = detectMilestones(transactions);
  timeline.push(...milestones);

  // Sort by date (oldest first)
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return timeline;
}

/**
 * Detect major milestones from transaction history
 */
function detectMilestones(transactions) {
  const milestones = [];

  if (!transactions || transactions.length === 0) return milestones;

  // Helper to get tx date
  const getTxDate = (tx) => {
    if (!tx) return null;
    
    // Try multiple possible date fields from Zerion API
    const dateStr = tx?.attributes?.mined_at 
      || tx?.attributes?.timestamp
      || tx?.attributes?.sent_at
      || tx?.attributes?.received_at
      || tx?.timestamp;
    
    if (!dateStr) {
      console.warn('⚠️  Transaction missing date:', JSON.stringify(tx, null, 2).slice(0, 200));
      return null;
    }
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('⚠️  Invalid date string:', dateStr);
        return null;
      }
      return date;
    } catch (error) {
      console.warn('⚠️  Error parsing date:', dateStr, error);
      return null;
    }
  };

  // Milestone: Reached 50 transactions
  // Transactions are sorted newest first [0=newest, length-1=oldest]
  // The 50th transaction ever = index (length - 50)
  if (transactions.length >= 50) {
    const tx50Index = transactions.length - 50;
    const tx50 = transactions[tx50Index];
    const tx50Date = getTxDate(tx50);
    
    console.log(`📍 50tx milestone: index=${tx50Index}, date=${tx50Date?.toISOString()}`);
    
    if (tx50Date) {
      milestones.push({
        date: tx50Date.toISOString(),
        label: 'Active trader',
        description: 'Reached 50 transactions',
        icon: '⚡',
      });
    }
  }

  // Milestone: Reached 100 transactions  
  if (transactions.length >= 100) {
    const tx100Index = transactions.length - 100;
    const tx100 = transactions[tx100Index];
    const tx100Date = getTxDate(tx100);
    
    console.log(`📍 100tx milestone: index=${tx100Index}, date=${tx100Date?.toISOString()}`);
    
    if (tx100Date) {
      milestones.push({
        date: tx100Date.toISOString(),
        label: 'Power trader milestone',
        description: 'Surpassed 100 on-chain transactions',
        icon: '💯',
      });
    }
  }

  // Milestone: Reached 200 transactions
  if (transactions.length >= 200) {
    const tx200Index = transactions.length - 200;
    const tx200 = transactions[tx200Index];
    const tx200Date = getTxDate(tx200);
    if (tx200Date) {
      milestones.push({
        date: tx200Date.toISOString(),
        label: 'Elite trader',
        description: '200+ transactions achieved',
        icon: '🌟',
      });
    }
  }

  // Milestone: Survived 2022 bear market
  const txIn2022 = transactions.filter(tx => {
    const date = getTxDate(tx);
    return date && date.getFullYear() === 2022;
  });
  
  if (txIn2022.length >= 5) {
    const firstIn2022 = txIn2022[txIn2022.length - 1];
    const date = getTxDate(firstIn2022);
    milestones.push({
      date: date?.toISOString() || new Date('2022-06-01').toISOString(),
      label: '🐻 Bear market survivor',
      description: 'Stayed active through 2022 crypto winter',
      icon: '💎',
    });
  }

  // Milestone: 2023 Bull run participant
  const txIn2023 = transactions.filter(tx => {
    const date = getTxDate(tx);
    return date && date.getFullYear() === 2023;
  });
  
  if (txIn2023.length >= 10) {
    milestones.push({
      date: new Date('2023-01-01').toISOString(),
      label: 'Bull run participant',
      description: 'Active during 2023 recovery',
      icon: '🚀',
    });
  }

  // Milestone: Multi-chain explorer (use earliest multi-chain transaction)
  const uniqueChains = new Set(
    transactions.map(tx => tx.relationships?.chain?.data?.id).filter(Boolean)
  );
  
  if (uniqueChains.size >= 3) {
    // Find when user started using multiple chains
    let multiChainDate = null;
    const seenChains = new Set();
    
    // Iterate from oldest to newest
    for (let i = transactions.length - 1; i >= 0; i--) {
      const chain = transactions[i]?.relationships?.chain?.data?.id;
      if (chain) {
        seenChains.add(chain);
        if (seenChains.size >= 3) {
          multiChainDate = getTxDate(transactions[i]);
          break;
        }
      }
    }
    
    if (multiChainDate) {
      milestones.push({
        date: multiChainDate.toISOString(),
        label: 'Multi-chain explorer',
        description: `Active on ${uniqueChains.size} different chains`,
        icon: '🌐',
      });
    }
  }

  // Milestone: 1 year anniversary
  const firstTx = transactions[transactions.length - 1];
  const firstDate = getTxDate(firstTx);
  if (firstDate) {
    const now = new Date();
    const oneYearAfterFirst = new Date(firstDate);
    oneYearAfterFirst.setFullYear(oneYearAfterFirst.getFullYear() + 1);
    
    // Only show if anniversary has passed
    if (oneYearAfterFirst < now) {
      milestones.push({
        date: oneYearAfterFirst.toISOString(),
        label: '1 year on-chain',
        description: 'Celebrated first year anniversary',
        icon: '🎂',
      });
    }
  }

  return milestones;
}

/**
 * Assign achievement badges based on behavior
 */
function assignBadges(transactions, timeline, stats) {
  const badges = [];
  const txCount = transactions.length;
  const ageMonths = stats.portfolioAgeMonths || 0;
  
  // Get first and recent transactions
  const firstTx = transactions[transactions.length - 1];
  const firstTxDate = firstTx?.attributes?.mined_at || firstTx?.attributes?.timestamp;
  
  // Calculate recent activity (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentTxCount = transactions.filter(tx => {
    const txDate = new Date(tx.attributes?.mined_at || tx.attributes?.timestamp).getTime();
    return txDate > thirtyDaysAgo;
  }).length;

  // 💎 Diamond Hands (1+ year active)
  if (ageMonths >= 12) {
    const years = Math.floor(ageMonths / 12);
    badges.push({
      id: 'diamond-hands',
      name: '💎 Diamond Hands',
      description: `Active for ${years} year${years > 1 ? 's' : ''}`,
    });
  }

  // 🚀 Early Adopter (active since 2020 or earlier)
  if (firstTxDate) {
    const firstDate = new Date(firstTxDate);
    if (firstDate.getFullYear() <= 2020) {
      badges.push({
        id: 'early-adopter',
        name: '🚀 Early Adopter',
        description: `On-chain since ${firstDate.getFullYear()}`,
      });
    }
  }

  // ⚡ Active Trader (50+ transactions)
  if (txCount >= 50) {
    badges.push({
      id: 'active-trader',
      name: '⚡ Active Trader',
      description: `${txCount}+ transactions`,
    });
  }

  // 🔥 Hot Streak (20+ transactions in last 30 days)
  if (recentTxCount >= 20) {
    badges.push({
      id: 'hot-streak',
      name: '🔥 Hot Streak',
      description: `${recentTxCount} transactions this month`,
    });
  }

  // 🐋 Whale (detect from transaction volumes if available)
  // This would require analyzing transaction values - placeholder for now
  const hasLargeTransactions = transactions.some(tx => {
    const value = tx.attributes?.fee?.value || 0;
    return value > 1000; // $1000+ in gas fees suggests whale activity
  });
  
  if (hasLargeTransactions && txCount > 100) {
    badges.push({
      id: 'whale',
      name: '🐋 Whale',
      description: 'High-value transactions',
    });
  }

  // 🎯 Consistent (at least 1 tx per month for 6+ months)
  if (ageMonths >= 6) {
    const avgTxPerMonth = txCount / ageMonths;
    if (avgTxPerMonth >= 1) {
      badges.push({
        id: 'consistent',
        name: '🎯 Consistent',
        description: 'Regular on-chain activity',
      });
    }
  }

  // 🌟 Power User (200+ transactions)
  if (txCount >= 200) {
    badges.push({
      id: 'power-user',
      name: '🌟 Power User',
      description: `${txCount}+ transactions`,
    });
  }

  // 🧪 Degen (very high activity, short timeframe)
  if (txCount > 100 && ageMonths < 6) {
    badges.push({
      id: 'degen',
      name: '🧪 Degen',
      description: 'High-frequency experimenter',
    });
  }

  // 🏆 Veteran (3+ years)
  if (ageMonths >= 36) {
    badges.push({
      id: 'veteran',
      name: '🏆 Veteran',
      description: 'Crypto OG - 3+ years',
    });
  }

  // 🌐 Multi-chain (detect from chain diversity)
  const uniqueChains = new Set(
    transactions.map(tx => tx.relationships?.chain?.data?.id).filter(Boolean)
  );
  
  if (uniqueChains.size >= 4) {
    badges.push({
      id: 'multi-chain',
      name: '🌐 Multi-chain',
      description: `Active on ${uniqueChains.size}+ chains`,
    });
  }

  return badges;
}

/**
 * Calculate profile stats from transaction history
 */
function calculateStats(transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      portfolioAgeMonths: 0,
      startDate: null,
      firstTxDate: null,
      lastTxDate: null,
      avgTxPerMonth: 0,
    };
  }

  const firstTx = transactions[transactions.length - 1];
  const lastTx = transactions[0];
  
  // Try multiple fields for timestamp
  const firstTxDate = firstTx?.attributes?.mined_at 
    || firstTx?.attributes?.timestamp 
    || firstTx?.timestamp;
  const lastTxDate = lastTx?.attributes?.mined_at 
    || lastTx?.attributes?.timestamp 
    || lastTx?.timestamp;
  
  // Calculate portfolio age in months
  const portfolioAge = firstTxDate
    ? Math.floor((Date.now() - new Date(firstTxDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  
  // Calculate average transactions per month
  const avgTxPerMonth = portfolioAge > 0 
    ? Math.round((transactions.length / portfolioAge) * 10) / 10 
    : 0;

  return {
    totalTransactions: transactions.length,
    portfolioAgeMonths: Math.max(0, portfolioAge),
    startDate: firstTxDate || null,
    firstTxDate: firstTxDate || null,
    lastTxDate: lastTxDate || null,
    avgTxPerMonth,
  };
}

/**
 * Generate dynamic tagline based on actual behavior
 */
function generateTagline(stats, badges, transactions) {
  // Analyze transaction patterns for better taglines
  const txCount = stats.totalTransactions || 0;
  const ageMonths = stats.portfolioAgeMonths || 0;
  
  // Extract activity patterns
  const hasDiamondHands = badges.some(b => b.id === 'diamond-hands');
  const isActiveTrader = badges.some(b => b.id === 'active-trader');
  const isEarlyAdopter = badges.some(b => b.id === 'early-adopter');
  const isWhale = badges.some(b => b.id === 'whale');
  const isDegen = badges.some(b => b.id === 'degen');
  
  // Calculate recent activity (last 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentTxCount = transactions.filter(tx => {
    const txDate = new Date(tx.attributes?.mined_at || tx.attributes?.timestamp).getTime();
    return txDate > thirtyDaysAgo;
  }).length;
  
  // Very active recently
  if (recentTxCount > 20) {
    return isWhale ? 'Active whale making waves' : 'High-frequency on-chain trader';
  }
  
  // Diamond hands with history
  if (hasDiamondHands && ageMonths >= 24) {
    return isWhale ? 'OG crypto whale' : 'Crypto veteran since the early days';
  }
  
  // Early adopter
  if (isEarlyAdopter) {
    return isActiveTrader ? 'OG trader, still building' : 'Early adopter, diamond hands';
  }
  
  // Whale activity
  if (isWhale) {
    return 'Whale moving markets';
  }
  
  // Degen trader
  if (isDegen) {
    return 'Degen trader chasing alpha';
  }
  
  // Active trader
  if (isActiveTrader) {
    return ageMonths < 6 ? 'Rising star in crypto' : 'Seasoned on-chain trader';
  }
  
  // Based on portfolio age
  if (ageMonths >= 12) {
    return txCount > 50 ? 'Experienced DeFi navigator' : 'Long-term crypto holder';
  }
  
  if (ageMonths >= 6) {
    return 'Crypto enthusiast building on-chain';
  }
  
  // New but active
  if (txCount > 30) {
    return 'New trader making moves';
  }
  
  // Default for newer accounts
  return txCount > 10 ? 'On-chain explorer' : 'Crypto newcomer';
}

