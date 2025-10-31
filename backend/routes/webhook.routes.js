import express from 'express';
import { handleZerionWebhook } from '../controller/webhook.controller.js';

const router = express.Router();

// POST /api/webhooks/zerion - Receive Zerion webhook events
router.post('/zerion', handleZerionWebhook);

export default router;

