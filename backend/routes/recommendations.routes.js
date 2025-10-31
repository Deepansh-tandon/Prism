import express from 'express';
import { getRecommendations } from '../controller/recommendations.controller.js';

const router = express.Router();

router.get('/:address', getRecommendations);

export default router;

