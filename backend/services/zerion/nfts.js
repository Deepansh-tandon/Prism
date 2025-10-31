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
 * Get NFT positions for a wallet
 * Docs: https://developers.zerion.io/reference/listwalletnftpositions.md
 */
export const getWalletNFTs = async (address, options = {}) => {
  try {
    const { limit = 50, offset = 0 } = options;

    const response = await zerionClient.get(`/v1/wallets/${address}/nft-positions`, {
      params: {
        'page[size]': limit,
        'page[offset]': offset,
        'sort': '-floor_price', // Sort by floor price descending
      },
    });

    const nfts = response.data?.data || [];
    
    return {
      nfts,
      meta: response.data?.meta || {},
    };
  } catch (error) {
    console.error('Error fetching NFTs:', error.message);
    throw new Error(`Failed to fetch NFTs: ${error.message}`);
  }
};

/**
 * Get NFT collections held by wallet
 * Docs: https://developers.zerion.io/reference/listwalletnftcollections.md
 */
export const getWalletNFTCollections = async (address) => {
  try {
    const response = await zerionClient.get(`/v1/wallets/${address}/nft-collections`, {
      params: {
        'sort': '-floor_price',
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching NFT collections:', error.message);
    return [];
  }
};

/**
 * Get single NFT details
 * Docs: https://developers.zerion.io/reference/getnftbyid.md
 */
export const getNFTById = async (nftId) => {
  try {
    const response = await zerionClient.get(`/v1/nfts/${nftId}`);
    return response.data?.data;
  } catch (error) {
    console.error('Error fetching NFT:', error.message);
    return null;
  }
};

