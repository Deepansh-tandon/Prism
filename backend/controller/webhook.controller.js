import { processWebhookEvent } from '../services/feed/processor.js';
import { AppError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import crypto from 'crypto';
import https from 'https';

/**
 * Verify Zerion webhook signature using certificate-based verification
 * Official docs: https://developers.zerion.io/reference/createsubscriptionwallettransactions.md
 */
async function verifyZerionWebhookSignature(body, headers) {
  const signature = headers['x-signature'];
  const timestamp = headers['x-timestamp'];
  const certificateUrl = headers['x-certificate-url'];

  // Skip verification in development if headers missing
  if (!signature || !timestamp || !certificateUrl) {
    if (config.nodeEnv === 'development') {
      console.log('⚠️  Webhook signature headers missing - allowing in dev mode');
      return true;
    }
    console.log('❌ Missing signature headers in production');
    return false;
  }

  try {
    // Step 1: Download certificate
    const certificate = await fetchCertificate(certificateUrl);
    
    // Step 2: Create message to verify (timestamp + "\n" + body + "\n")
    const message = `${timestamp}\n${body}\n`;
    
    // Step 3: Verify signature using certificate
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();
    
    const isValid = verify.verify(certificate, signature, 'base64');
    
    if (!isValid) {
      console.log('❌ Invalid webhook signature');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error.message);
    return false;
  }
}

/**
 * Fetch certificate from Zerion's URL
 */
function fetchCertificate(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch certificate: ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * POST /api/webhooks/zerion
 * Handle incoming Zerion webhook events
 * Docs: https://developers.zerion.io/reference/createsubscriptionwallettransactions.md
 */
export const handleZerionWebhook = async (req, res, next) => {
  try {
    const event = req.body;
    
    // Get raw body for signature verification
    const rawBody = JSON.stringify(event);

    // Verify webhook signature (certificate-based)
    const isValid = await verifyZerionWebhookSignature(rawBody, req.headers);
    
    if (!isValid && config.nodeEnv === 'production') {
      throw new AppError('Invalid webhook signature', 401);
    }

    console.log('📥 Webhook received:', event.data?.type || 'unknown');

    // Process event asynchronously (don't block response)
    processWebhookEvent(event, req.app.get('io'))
      .catch(err => console.error('Error processing webhook:', err));

    // Respond immediately to Zerion (important!)
    res.json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
};

