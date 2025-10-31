import express from 'express';
import {
  getWalletNFTsController,
  getWalletNFTCollectionsController,
} from '../controller/nft.controller.js';

const router = express.Router();

// GET /api/nfts/wallet/:address - Get wallet's NFT positions
router.get('/wallet/:address', getWalletNFTsController);

// GET /api/nfts/wallet/:address/collections - Get wallet's NFT collections
router.get('/wallet/:address/collections', getWalletNFTCollectionsController);

export default router;

