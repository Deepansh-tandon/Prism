import express from 'express';
import {
  listSubscriptions,
  deleteSubscription,
} from '../controller/subscription.controller.js';

const router = express.Router();

// GET /api/subscriptions - List all active Zerion subscriptions
router.get('/', listSubscriptions);

// DELETE /api/subscriptions/:id - Delete a specific subscription
router.delete('/:id', deleteSubscription);

export default router;

