import axios from 'axios';
import { config } from '../../config/env.js';
import { prisma } from '../../config/database.js';

const zerionClient = axios.create({
  baseURL: config.zerion.baseUrl,
  headers: {
    'Authorization': `Basic ${Buffer.from(config.zerion.apiKey + ':').toString('base64')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Subscribe to transaction notifications for a wallet address
 * @param {string} address - Wallet address to monitor
 * @param {string[]} chainIds - Array of chain IDs (e.g., ['ethereum', 'base', 'arbitrum']) or empty for all chains
 * @returns {Promise<string|null>} Subscription ID
 */
export const subscribeToWalletTransactions = async (address, chainIds = []) => {
  try {
    console.log(`  📡 Creating Zerion subscription for ${address}`);

    const payload = {
      addresses: [address.toLowerCase()],
      callback_url: config.zerion.webhookUrl,
    };

    // Only add chain_ids if specific chains are requested
    if (chainIds.length > 0) {
      payload.chain_ids = chainIds;
    }

    const response = await zerionClient.post('/v1/tx-subscriptions', payload);

    const subscriptionId = response.data?.data?.id;

    if (!subscriptionId) {
      console.error('  ⚠️  No subscription ID returned from Zerion');
      return null;
    }

    // Store subscription in database
    await prisma.trackedWallet.upsert({
      where: { address: address.toLowerCase() },
      update: {
        webhookId: subscriptionId,
        trackedByCount: { increment: 1 },
      },
      create: {
        address: address.toLowerCase(),
        webhookId: subscriptionId,
        trackedByCount: 1,
      },
    });

    console.log(`  ✅ Subscription created: ${subscriptionId}`);
    return subscriptionId;
  } catch (error) {
    console.error(`  ❌ Error subscribing to ${address}:`, error.response?.data || error.message);
    // Don't throw - allow onboarding to continue even if subscription fails
    return null;
  }
};

/**
 * Unsubscribe from transaction notifications
 * @param {string} subscriptionId - Zerion subscription ID
 * @returns {Promise<boolean>}
 */
export const unsubscribeFromWallet = async (subscriptionId) => {
  try {
    await zerionClient.delete(`/v1/tx-subscriptions/${subscriptionId}`);
    console.log(`✅ Unsubscribed: ${subscriptionId}`);
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Subscribe to multiple similar wallets at once
 * @param {Array} similarWallets - Array of wallet objects with address property
 * @param {string[]} chainIds - Optional chain IDs to filter
 * @returns {Promise<string[]>} Array of successful subscription IDs
 */
export const subscribeToSimilarWallets = async (similarWallets, chainIds = []) => {
  if (!similarWallets || similarWallets.length === 0) {
    return [];
  }

  console.log(`📡 Creating ${similarWallets.length} Zerion subscriptions...`);

  // Subscribe to wallets in batches to avoid rate limits
  const batchSize = 5;
  const subscriptions = [];

  for (let i = 0; i < similarWallets.length; i += batchSize) {
    const batch = similarWallets.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(wallet => subscribeToWalletTransactions(wallet.address, chainIds))
    );

    const successfulSubs = batchResults
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    subscriptions.push(...successfulSubs);

    // Small delay between batches to be nice to the API
    if (i + batchSize < similarWallets.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Created ${subscriptions.length}/${similarWallets.length} subscriptions`);
  return subscriptions;
};

/**
 * Get all active subscriptions
 * @returns {Promise<Array>}
 */
export const listAllSubscriptions = async () => {
  try {
    const response = await zerionClient.get('/v1/tx-subscriptions');
    return response.data?.data || [];
  } catch (error) {
    console.error('Error listing subscriptions:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Clean up subscriptions for a wallet that's no longer tracked
 * @param {string} address - Wallet address
 */
export const cleanupUnusedSubscription = async (address) => {
  try {
    const tracked = await prisma.trackedWallet.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (!tracked) return false;

    // Decrement tracker count
    const updated = await prisma.trackedWallet.update({
      where: { address: address.toLowerCase() },
      data: {
        trackedByCount: Math.max(0, tracked.trackedByCount - 1),
      },
    });

    // If no one is tracking anymore, delete the subscription
    if (updated.trackedByCount === 0 && tracked.webhookId) {
      await unsubscribeFromWallet(tracked.webhookId);
      await prisma.trackedWallet.delete({
        where: { address: address.toLowerCase() },
      });
      console.log(`🗑️  Cleaned up subscription for ${address}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error cleaning up subscription:', error);
    return false;
  }
};

