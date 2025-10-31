import { prisma } from '../../config/database.js';

/**
 * Process incoming webhook events and broadcast to clients
 */
export const processWebhookEvent = async (event, io) => {
  try {
    console.log('📥 Processing webhook event:', event.type);

    // Extract relevant data from Zerion webhook
    const activity = parseWebhookEvent(event);

    if (!activity) {
      console.log('  ⚠️  Event not relevant, skipping');
      return;
    }

    // Save to database
    const savedActivity = await prisma.activity.create({
      data: activity,
    });

    // Find users who are tracking this wallet
    const trackingUsers = await findUsersTrackingWallet(activity.address);

    if (trackingUsers.length > 0) {
      console.log(`  📡 Broadcasting to ${trackingUsers.length} users`);
      
      // Broadcast to connected WebSocket clients
      trackingUsers.forEach(user => {
        io.to(`user:${user.address}`).emit('activity', {
          ...savedActivity,
          similarWallet: {
            address: activity.address,
            personality: user.personalityType,
          },
        });
      });
    }

    console.log(`  ✅ Processed activity for ${activity.address}`);
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
};

/**
 * Find users who are tracking this wallet (via similarity)
 */
async function findUsersTrackingWallet(walletAddress) {
  try {
    // Find all similarity edges where this wallet is the similar address
    const edges = await prisma.similarityEdge.findMany({
      where: {
        similarAddress: walletAddress.toLowerCase(),
      },
      include: {
        user: {
          select: {
            address: true,
            personalityType: true,
          },
        },
      },
    });

    return edges.map(edge => edge.user);
  } catch (error) {
    console.error('Error finding tracking users:', error);
    return [];
  }
}

/**
 * Parse Zerion webhook event into our activity format
 */
function parseWebhookEvent(event) {
  // Zerion webhook structure varies by event type
  // This is a simplified parser

  try {
    const eventType = event.type;
    const data = event.data?.attributes || {};

    if (eventType === 'transaction.confirmed') {
      return {
        address: data.wallet_address,
        activityType: 'transaction',
        chain: data.chain || 'ethereum',
        txHash: data.hash,
        metadata: data,
        timestamp: new Date().toISOString(),
      };
    }

    if (eventType === 'position.updated') {
      return {
        address: data.wallet_address,
        activityType: 'position_change',
        chain: data.chain,
        tokenIn: data.token_in,
        tokenOut: data.token_out,
        metadata: data,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing webhook:', error);
    return null;
  }
}

