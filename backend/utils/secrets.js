import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Secrets Manager retrieval utility for Lambda functions.
 * 
 * Features:
 * - In-memory caching with 5-minute TTL to reduce API calls in warm Lambda invocations
 * - Graceful secret rotation handling (invalidate cache and retry on auth failure)
 * - Local development fallback to environment variables
 * 
 *  11.5 (secrets storage with auto-rotation every 90 days)
 *              11.6 (Lambda retrieves updated secrets without redeployment)
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache: { [secretName]: { value, timestamp } }
const secretsCache = new Map();

// Lazy-initialized Secrets Manager client
let client = null;

/**
 * Returns the Secrets Manager client, creating it if needed.
 * Allows injection for testing.
 */
function getClient() {
  if (!client) {
    client = new SecretsManagerClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
    });
  }
  return client;
}

/**
 * Sets a custom Secrets Manager client (useful for testing).
 * @param {SecretsManagerClient} customClient
 */
function setClient(customClient) {
  client = customClient;
}

/**
 * Checks if a cached entry is still valid (within TTL).
 * @param {object} entry - Cache entry with value and timestamp
 * @returns {boolean}
 */
function isCacheValid(entry) {
  if (!entry) return false;
  return (Date.now() - entry.timestamp) < CACHE_TTL_MS;
}

/**
 * Fetches a secret value from AWS Secrets Manager with in-memory caching.
 * In local development (NODE_ENV !== 'production'), falls back to environment variables.
 * 
 * @param {string} secretName - The secret name/ARN in Secrets Manager
 * @returns {Promise<string|object>} The secret value (parsed JSON if applicable, raw string otherwise)
 */
async function getSecret(secretName) {
  // Local development fallback: use environment variables
  if (process.env.NODE_ENV !== 'production') {
    return getLocalFallback(secretName);
  }

  // Check cache first
  const cached = secretsCache.get(secretName);
  if (isCacheValid(cached)) {
    return cached.value;
  }

  // Fetch from Secrets Manager
  const value = await fetchSecretFromAWS(secretName);

  // Cache the result
  secretsCache.set(secretName, {
    value,
    timestamp: Date.now(),
  });

  return value;
}

/**
 * Fetches a secret directly from AWS Secrets Manager (no cache).
 * @param {string} secretName - The secret name/ARN
 * @returns {Promise<string|object>} Parsed secret value
 */
async function fetchSecretFromAWS(secretName) {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await getClient().send(command);

  const secretString = response.SecretString;
  if (!secretString) {
    throw new Error(`Secret "${secretName}" has no string value`);
  }

  // Attempt to parse as JSON; return raw string if not valid JSON
  try {
    return JSON.parse(secretString);
  } catch {
    return secretString;
  }
}

/**
 * Invalidates the cached value for a specific secret.
 * Used when a secret rotation is detected (e.g., DB auth failure).
 * 
 * @param {string} secretName - The secret name to invalidate
 */
function invalidateCache(secretName) {
  secretsCache.delete(secretName);
}

/**
 * Invalidates all cached secrets.
 */
function invalidateAllCache() {
  secretsCache.clear();
}

/**
 * Retrieves the DocumentDB connection URI from Secrets Manager.
 * Constructs the URI from stored credentials if the secret contains individual fields.
 * Handles secret rotation gracefully by retrying with a fresh secret on auth failure.
 * 
 * @returns {Promise<string>} The DocumentDB connection URI
 */
async function getDocumentDBUri() {
  // Local development fallback
  if (process.env.NODE_ENV !== 'production') {
    return process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly';
  }

  const secretName = process.env.DOCUMENTDB_SECRET_NAME || 'taskly/production/documentdb-credentials';
  const secret = await getSecret(secretName);

  return buildDocumentDBUri(secret);
}

/**
 * Builds a DocumentDB connection URI from secret credentials.
 * @param {object} secret - The secret object with username, password, host, port, dbname
 * @returns {string} The connection URI
 */
function buildDocumentDBUri(secret) {
  if (typeof secret === 'string') {
    // Secret is already a full URI
    return secret;
  }

  const { username, password, host, port, dbname } = secret;
  if (!username || !password || !host) {
    throw new Error('DocumentDB secret missing required fields (username, password, host)');
  }

  const dbPort = port || 27017;
  const database = dbname || 'taskly';
  const encodedPassword = encodeURIComponent(password);

  return `mongodb://${username}:${encodedPassword}@${host}:${dbPort}/${database}?tls=true&tlsCAFile=/var/task/global-bundle.pem&retryWrites=false&directConnection=true&authMechanism=SCRAM-SHA-1`;
}

/**
 * Wraps a database operation with secret rotation handling.
 * If the operation fails with an auth error, invalidates the cached secret and retries once.
 * 
 * @param {Function} operation - Async function to execute (e.g., DB connection attempt)
 * @param {string} secretName - The secret name to invalidate on auth failure
 * @returns {Promise<*>} The result of the operation
 */
async function withRotationRetry(operation, secretName) {
  try {
    return await operation();
  } catch (error) {
    if (isAuthError(error)) {
      // Secret may have been rotated — invalidate cache and retry
      invalidateCache(secretName);
      return await operation();
    }
    throw error;
  }
}

/**
 * Determines if an error is an authentication/authorization failure
 * that could indicate a rotated secret.
 * @param {Error} error
 * @returns {boolean}
 */
function isAuthError(error) {
  const authErrorCodes = [
    'AuthenticationFailed',
    'Unauthorized',
    'InvalidCredentials',
  ];

  const authErrorMessages = [
    'authentication failed',
    'auth failed',
    'unauthorized',
    'invalid credentials',
    'login failed',
  ];

  if (error.code && authErrorCodes.includes(error.code)) {
    return true;
  }

  if (error.codeName && authErrorCodes.includes(error.codeName)) {
    return true;
  }

  const message = (error.message || '').toLowerCase();
  return authErrorMessages.some(msg => message.includes(msg));
}

/**
 * Local development fallback: maps secret names to environment variables.
 * @param {string} secretName - The secret name
 * @returns {object|string|null} The fallback value
 */
function getLocalFallback(secretName) {
  const fallbackMap = {
    'taskly/production/documentdb-credentials': {
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'password',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '27017', 10),
      dbname: process.env.DB_NAME || 'taskly',
      engine: 'mongo',
    },
    'taskly/production/jwt-signing-key': {
      secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    },
    'taskly/production/cognito-client-secret': {
      client_id: process.env.COGNITO_CLIENT_ID || '',
      client_secret: process.env.COGNITO_CLIENT_SECRET || '',
      user_pool_id: process.env.COGNITO_USER_POOL_ID || '',
    },
    'taskly/production/ses-smtp-credentials': {
      smtp_username: process.env.SES_SMTP_USERNAME || '',
      smtp_password: process.env.SES_SMTP_PASSWORD || '',
      smtp_endpoint: process.env.SES_SMTP_ENDPOINT || 'email-smtp.us-east-1.amazonaws.com',
      smtp_port: parseInt(process.env.SES_SMTP_PORT || '587', 10),
      sender_email: process.env.SES_SENDER_EMAIL || 'noreply@taskly.app',
    },
  };

  // Try exact match first
  if (fallbackMap[secretName]) {
    return fallbackMap[secretName];
  }

  // Try partial match (environment-agnostic)
  const normalizedName = secretName.replace(/\/(dev|staging|production)\//, '/production/');
  if (fallbackMap[normalizedName]) {
    return fallbackMap[normalizedName];
  }

  // Return null if no fallback found
  return null;
}

export {
  getSecret,
  getDocumentDBUri,
  invalidateCache,
  invalidateAllCache,
  withRotationRetry,
  setClient,
};

export default {
  getSecret,
  getDocumentDBUri,
  invalidateCache,
  invalidateAllCache,
  withRotationRetry,
  setClient,
};
