import express from 'express';
import {
  getSimilarWallets,
  discoverWallets,
} from '../controller/discover.controller.js';

const router = express.Router();

// GET /api/discover/similar/:address - Get similar wallets
router.get('/similar/:address', getSimilarWallets);

// GET /api/discover - Browse/search wallets
router.get('/', discoverWallets);

export default router;

