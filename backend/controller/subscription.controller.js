import {
  listAllSubscriptions,
  unsubscribeFromWallet,
} from '../services/zerion/subscriptions.js';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/subscriptions
 * List all active Zerion webhook subscriptions
 */
export const listSubscriptions = async (req, res, next) => {
  try {
    // Get from Zerion API
    const zerionSubs = await listAllSubscriptions();

    // Get from our database
    const dbSubs = await prisma.trackedWallet.findMany({
      select: {
        address: true,
        webhookId: true,
        trackedByCount: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        zerionSubscriptions: zerionSubs,
        databaseSubscriptions: dbSubs,
        total: dbSubs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/subscriptions/:id
 * Delete a specific subscription
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Subscription ID is required', 400);
    }

    // Find in database
    const tracked = await prisma.trackedWallet.findFirst({
      where: { webhookId: id },
    });

    if (!tracked) {
      throw new AppError('Subscription not found', 404);
    }

    // Delete from Zerion
    const deleted = await unsubscribeFromWallet(id);

    if (!deleted) {
      throw new AppError('Failed to delete subscription from Zerion', 500);
    }

    // Delete from database
    await prisma.trackedWallet.delete({
      where: { address: tracked.address },
    });

    res.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

