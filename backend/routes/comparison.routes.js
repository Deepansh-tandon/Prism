import express from 'express';
import { getPortfolioComparison } from '../controller/comparison.controller.js';

const router = express.Router();

router.get('/:address', getPortfolioComparison);

export default router;

