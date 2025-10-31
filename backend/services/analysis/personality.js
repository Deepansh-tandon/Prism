/**
 * Personality type definitions
 * Following your enum preference [[memory:7510236]]
 */
export const PERSONALITY_TYPES = {
  CONSERVATIVE_DEFI_NATIVE: 'Conservative DeFi Native',
  DEGEN_TRADER: 'Degen Trader',
  BLUECHIP_HODLER: 'Blue-chip Hodler',
  MULTICHAIN_EXPLORER: 'Multi-chain Explorer',
  YIELD_FARMER: 'Yield Farmer',
  STABLECOIN_PARKER: 'Stablecoin Parker',
  NFT_COLLECTOR: 'NFT Collector',
  BALANCED_TRADER: 'Balanced Trader',
};

/**
 * Determine personality type based on metrics
 */
export const calculatePersonality = (metrics) => {
  const {
    allocations,
    chainCount,
    protocolCount,
    concentration,
    avgTxPerMonth,
  } = metrics;

  // Stablecoin Parker: >60% stablecoins
  if (allocations.stablecoins > 0.6) {
    return PERSONALITY_TYPES.STABLECOIN_PARKER;
  }

  // Blue-chip Hodler: >70% in ETH/BTC
  if (allocations.bluechip > 0.7 && avgTxPerMonth < 5) {
    return PERSONALITY_TYPES.BLUECHIP_HODLER;
  }

  // Degen Trader: High tx frequency + low bluechip
  if (avgTxPerMonth > 20 && allocations.bluechip < 0.3) {
    return PERSONALITY_TYPES.DEGEN_TRADER;
  }

  // Multi-chain Explorer: 4+ chains
  if (chainCount >= 4) {
    return PERSONALITY_TYPES.MULTICHAIN_EXPLORER;
  }

  // Yield Farmer: 5+ DeFi protocols
  if (protocolCount >= 5 && allocations.defi > 0.2) {
    return PERSONALITY_TYPES.YIELD_FARMER;
  }

  // Conservative DeFi Native: Balanced bluechip + DeFi
  if (allocations.bluechip > 0.4 && protocolCount >= 3) {
    return PERSONALITY_TYPES.CONSERVATIVE_DEFI_NATIVE;
  }

  // Default: Balanced Trader
  return PERSONALITY_TYPES.BALANCED_TRADER;
};

