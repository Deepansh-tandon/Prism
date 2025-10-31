import axios from 'axios';
import { config } from '../../config/env.js';

const zerionClient = axios.create({
  baseURL: config.zerion.baseUrl,
  headers: {
    'Authorization': `Basic ${Buffer.from(config.zerion.apiKey + ':').toString('base64')}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Get portfolio data for a wallet address
 */
export const getPortfolioData = async (address) => {
  try {
    console.log(`📡 Fetching portfolio for: ${address}`);
    const response = await zerionClient.get(`/v1/wallets/${address}/portfolio`, {
      params: {
        'currency': 'usd',
      },
    });
    
    console.log('✅ Portfolio response status:', response.status);
    console.log('📊 Response data structure:', {
      hasData: !!response.data?.data,
      dataType: typeof response.data?.data,
      attributes: response.data?.data?.attributes ? Object.keys(response.data.data.attributes) : 'none'
    });
    
    const data = response.data?.data;
    
    if (!data) {
      console.error('❌ No data returned from Zerion');
      return {
        address,
        totalValue: 0,
        positions: [],
        chains: [],
        timestamp: new Date().toISOString(),
      };
    }
    
    let totalValue = data.attributes?.total?.value || 0;
    
    // Zerion doesn't include positions in portfolio endpoint
    // Need to fetch separately using /positions endpoint
    const positionsData = await getFungiblePositions(address);
    
    // Calculate total value from positions if API returned 0
    if (totalValue === 0 && positionsData.length > 0) {
      totalValue = positionsData.reduce((sum, position) => {
        const positionValue = position.attributes?.value || 0;
        return sum + positionValue;
      }, 0);
      console.log(`💰 Calculated portfolio value from positions: $${totalValue.toFixed(2)}`);
    }
    
    console.log(`💰 Portfolio value: $${totalValue.toFixed(2)}, Positions: ${positionsData.length}`);
    
    // Extract chains from positions distribution
    const chains = data.attributes?.positions_distribution_by_chain 
      ? Object.keys(data.attributes.positions_distribution_by_chain)
      : [];
    
    // Transform positions to simpler format for analysis
    const transformedPositions = positionsData.map(pos => ({
      symbol: pos.attributes?.fungible_info?.symbol || 'UNKNOWN',
      name: pos.attributes?.fungible_info?.name || 'Unknown Token',
      value: pos.attributes?.value || 0,
      quantity: pos.attributes?.quantity?.float || 0,
      price: pos.attributes?.price || 0,
      chain: pos.relationships?.chain?.data?.id || 'unknown',
    }));
    
    // Transform to our format
    return {
      address,
      totalValue,
      positions: transformedPositions,
      chains,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching portfolio:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }
};

/**
 * Get transaction history for a wallet
 */
export const getTransactionHistory = async (address, options = {}) => {
  try {
    // Zerion limit: max 100 for EVM wallets
    const { limit = 50, offset = 0 } = options;
    const safeLimit = Math.min(limit, 100); // Cap at 100
    
    const response = await zerionClient.get(`/v1/wallets/${address}/transactions`, {
      params: {
        'page[size]': safeLimit, // Use capped limit
        'page[after]': offset > 0 ? offset : undefined, // Zerion uses cursor-based pagination
        'currency': 'usd',
      },
    });
    
    const transactions = response.data?.data || [];
    
    return {
      transactions,
      meta: response.data?.meta || {},
      links: response.data?.links || {},
    };
  } catch (error) {
    console.error('Error fetching transactions:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Return empty array instead of throwing to allow onboarding to continue
    console.warn('⚠️  Returning empty transactions array');
    return {
      transactions: [],
      meta: {},
      links: {},
    };
  }
};

/**
 * Get fungible positions (tokens)
 */
export const getFungiblePositions = async (address) => {
  try {
    const response = await zerionClient.get(`/v1/wallets/${address}/positions`, {
      params: {
        'filter[position_types]': 'wallet',
        'sort': '-value',
      },
    });
    
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching positions:', error.message);
    return [];
  }
};

/**
 * Subscribe to webhook for wallet address
 */
export const subscribeWebhook = async (address) => {
  try {
    const response = await zerionClient.post('/v1/webhooks', {
      data: {
        type: 'webhook',
        attributes: {
          url: config.zerion.webhookUrl,
          event_types: ['transaction.confirmed', 'position.updated'],
          filters: {
            wallet_addresses: [address],
          },
        },
      },
    });
    
    return response.data?.data?.id;
  } catch (error) {
    console.error('Error subscribing webhook:', error.message);
    return null;
  }
};

/**
 * Unsubscribe webhook
 */
export const unsubscribeWebhook = async (webhookId) => {
  try {
    await zerionClient.delete(`/v1/webhooks/${webhookId}`);
    return true;
  } catch (error) {
    console.error('Error unsubscribing webhook:', error.message);
    return false;
  }
};

/**
 * Helper: Extract unique chains from portfolio data (DEPRECATED - not used)
 */
function extractChains(portfolioData) {
  // This function is no longer used - chains come from positions_distribution_by_chain
  const positions = portfolioData.attributes?.positions || [];
  const chains = new Set();
  
  positions.forEach(position => {
    if (position.chain) {
      chains.add(position.chain);
    }
  });
  
  return Array.from(chains);
}

