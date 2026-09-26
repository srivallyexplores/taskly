import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';

/**
 * AWS SDK v3 client initialization for Lambda environment.
 * 
 * All clients are configured with the region from the AWS_REGION environment
 * variable (automatically set in Lambda) or a fallback for local development.
 * 
 * Clients are instantiated once and reused across warm Lambda invocations
 * to take advantage of connection keep-alive and reduce initialization overhead.
 * 
 *  1.2, 11.5, 11.6
 */

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

/**
 * Secrets Manager client for retrieving application secrets
 * (DocumentDB credentials, JWT signing key, Cognito client secret, SES SMTP credentials).
 * Secrets are cached in-memory by the secrets utility (backend/utils/secrets.js).
 */
export const secretsManagerClient = new SecretsManagerClient({ region });

/**
 * S3 client for generating pre-signed upload URLs and managing file storage.
 * Used by the upload routes to replace Cloudinary with S3-based file storage.
 */
export const s3Client = new S3Client({ region });

/**
 * SES client for sending transactional emails (password reset, team invitations,
 * notification digests). Replaces Resend/Nodemailer in the AWS architecture.
 */
export const sesClient = new SESClient({ region });

/**
 * EventBridge client for publishing asynchronous application events
 * (task.completed, team.member.added, project.updated, etc.).
 * Events are processed by dedicated Lambda consumers via SQS queues.
 */
export const eventBridgeClient = new EventBridgeClient({ region });

/**
 * Export the configured region for use by other modules that need it.
 */
export { region as awsRegion };

export default {
  secretsManagerClient,
  s3Client,
  sesClient,
  eventBridgeClient,
  awsRegion: region,
};
