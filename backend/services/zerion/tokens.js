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
 * Get fungible asset details (token info)
 * Docs: https://developers.zerion.io/reference/getfungiblebyid.md
 */
export const getTokenById = async (tokenId) => {
  try {
    const response = await zerionClient.get(`/v1/fungibles/${tokenId}`);
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching token:', error.message);
    return null;
  }
};

/**
 * Get price chart for a token
 * Docs: https://developers.zerion.io/reference/getfungiblechart.md
 */
export const getTokenChart = async (tokenId, period = '1d') => {
  try {
    // Periods: 1h, 1d, 1w, 1m, 3m, 1y, max
    const response = await zerionClient.get(`/v1/fungibles/${tokenId}/chart`, {
      params: {
        'currency': 'usd',
        'period': period,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching chart:', error.message);
    return [];
  }
};

/**
 * Search for tokens
 * Docs: https://developers.zerion.io/reference/listfungibles.md
 */
export const searchTokens = async (query, limit = 10) => {
  try {
    const response = await zerionClient.get('/v1/fungibles', {
      params: {
        'filter[search_query]': query,
        'page[size]': limit,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error('Error searching tokens:', error.message);
    return [];
  }
};

/**
 * Get live token prices for multiple tokens by symbols
 */
export const getTokenPrices = async (symbols) => {
  try {
    // Search for each symbol to find the token, then fetch its price
    const promises = symbols.map(async (symbol) => {
      try {
        // Search for the token by symbol
        const searchResults = await searchTokens(symbol, 5);
        
        if (!searchResults || searchResults.length === 0) {
          console.warn(`Token not found for symbol: ${symbol}`);
          return {
            id: null,
            symbol: symbol.toUpperCase(),
            name: null,
            price: null,
            change24h: null,
            marketCap: null,
            error: 'Token not found',
          };
        }

        // Find exact match or best match by symbol
        const symbolUpper = symbol.toUpperCase();
        let token = searchResults.find(
          t => t.attributes?.symbol?.toUpperCase() === symbolUpper
        );
        
        // If no exact match, use the first result
        if (!token) {
          token = searchResults[0];
        }

        // Get full token details with price
        const tokenDetails = await getTokenById(token.id);

        return {
          id: tokenDetails?.id,
          symbol: tokenDetails?.attributes?.symbol,
          name: tokenDetails?.attributes?.name,
          price: tokenDetails?.attributes?.market_data?.price,
          change24h: tokenDetails?.attributes?.market_data?.changes?.percent_1d,
          marketCap: tokenDetails?.attributes?.market_data?.market_cap,
        };
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error.message);
        return {
          id: null,
          symbol: symbol.toUpperCase(),
          name: null,
          price: null,
          change24h: null,
          marketCap: null,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error('Error fetching token prices:', error.message);
    return [];
  }
};

