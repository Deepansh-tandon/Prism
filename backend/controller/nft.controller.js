import { getWalletNFTs, getWalletNFTCollections } from '../services/zerion/nfts.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/nfts/wallet/:address
 * Get NFT positions for a wallet
 */
export const getWalletNFTsController = async (req, res, next) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`🖼️  Fetching NFTs for ${address}`);

    const result = await getWalletNFTs(address, { limit, offset });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/nfts/wallet/:address/collections
 * Get NFT collections held by wallet
 */
export const getWalletNFTCollectionsController = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      throw new AppError('Wallet address is required', 400);
    }

    console.log(`🎨 Fetching NFT collections for ${address}`);

    const collections = await getWalletNFTCollections(address);

    res.json({
      success: true,
      data: {
        collections,
      },
    });
  } catch (error) {
    next(error);
  }
};

