/**
 * Production Configuration — AWS Service Wiring
 *
 * Reads all configuration from Secrets Manager and environment variables.
 * Used by Lambda functions in the AWS production environment.
 *
 * This module centralizes all AWS service configuration so that
 * individual modules don't need to know about Secrets Manager directly.
 *
 *  9.7, 11.9, 1.2
 */

import { secretsManagerClient, s3Client, sesClient, eventBridgeClient } from './aws.js';
import secrets from '../utils/secrets.js';

const { getSecret, getDocumentDBUri } = secrets;

// ─── Configuration Cache ─────────────────────────────────────────────────────

let _config = null;

/**
 * Loads and caches production configuration from Secrets Manager.
 * Called once during Lambda cold start, then cached for warm invocations.
 *
 * @returns {Promise<object>} Production configuration object
 */
export async function getProductionConfig() {
  if (_config) return _config;

  const environment = process.env.NODE_ENV || 'production';

  _config = {
    environment,

    // Database
    database: {
      uri: await getDocumentDBUri(),
      options: {
        maxPoolSize: 2,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: false,
      },
    },

    // Authentication (Cognito)
    auth: {
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID,
      region: process.env.AWS_REGION || 'us-east-1',
    },

    // File Storage (S3)
    storage: {
      uploadBucket: process.env.S3_UPLOAD_BUCKET || 'taskly-prod-uploads',
      cdnDomain: process.env.CDN_DOMAIN || '',
      presignedUrlExpiry: 300, // 5 minutes
    },

    // Email (SES)
    email: {
      fromAddress: process.env.SES_FROM_EMAIL || 'noreply@taskly.app',
      region: process.env.AWS_REGION || 'us-east-1',
      queueUrl: process.env.EMAIL_QUEUE_URL || '',
    },

    // Events (EventBridge)
    events: {
      busName: process.env.EVENT_BUS_NAME || 'taskly-prod-events',
      source: 'taskly.api',
    },

    // Notifications (SQS)
    notifications: {
      queueUrl: process.env.NOTIFICATION_QUEUE_URL || '',
    },

    // AWS SDK Clients (pre-initialized)
    clients: {
      secretsManager: secretsManagerClient,
      s3: s3Client,
      ses: sesClient,
      eventBridge: eventBridgeClient,
    },
  };

  return _config;
}

/**
 * Resets the cached configuration.
 * Used when secrets are rotated and need to be refreshed.
 */
export function resetConfig() {
  _config = null;
}

/**
 * Gets a specific configuration section.
 * @param {string} section - Configuration section name
 * @returns {Promise<object>}
 */
export async function getConfigSection(section) {
  const config = await getProductionConfig();
  return config[section];
}

export default {
  getProductionConfig,
  resetConfig,
  getConfigSection,
};
