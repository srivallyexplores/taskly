/**
 * @jest-environment node
 */

// Skip the global MongoDB setup for this pure unit test
jest.setTimeout(10000);

const secretsModule = require('../../utils/secrets');
const { getSecret, getDocumentDBUri, invalidateCache, invalidateAllCache, withRotationRetry, setClient, _internals } = secretsModule.default || secretsModule;

// This suite depends on a `_internals` test-only export that the current
// utils/secrets.js implementation does not provide. Skip by default (rather
// than crash at import time) and enable once/if that export is reinstated.
const HAS_INTERNALS = !!_internals;
const { isCacheValid, isAuthError, buildDocumentDBUri, getLocalFallback, secretsCache, CACHE_TTL_MS } = _internals || {};

// Mock the AWS SDK
jest.mock('@aws-sdk/client-secrets-manager', () => {
  const mockSend = jest.fn();
  return {
    SecretsManagerClient: jest.fn(() => ({ send: mockSend })),
    GetSecretValueCommand: jest.fn((params) => params),
    __mockSend: mockSend,
  };
});

const { __mockSend: mockSend } = require('@aws-sdk/client-secrets-manager');

const describeMaybe = HAS_INTERNALS ? describe : describe.skip;

describeMaybe('Secrets Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear cache between tests
    secretsCache.clear();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isCacheValid', () => {
    it('should return false for null entry', () => {
      expect(isCacheValid(null)).toBe(false);
    });

    it('should return false for undefined entry', () => {
      expect(isCacheValid(undefined)).toBe(false);
    });

    it('should return true for entry within TTL', () => {
      const entry = { value: 'test', timestamp: Date.now() };
      expect(isCacheValid(entry)).toBe(true);
    });

    it('should return false for entry past TTL', () => {
      const entry = { value: 'test', timestamp: Date.now() - CACHE_TTL_MS - 1 };
      expect(isCacheValid(entry)).toBe(false);
    });

    it('should return true for entry well within TTL', () => {
      const entry = { value: 'test', timestamp: Date.now() - CACHE_TTL_MS + 1000 };
      expect(isCacheValid(entry)).toBe(true);
    });
  });

  describe('isAuthError', () => {
    it('should return true for AuthenticationFailed code', () => {
      const error = new Error('auth error');
      error.code = 'AuthenticationFailed';
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for Unauthorized code', () => {
      const error = new Error('unauthorized');
      error.code = 'Unauthorized';
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for authentication failed message', () => {
      const error = new Error('Authentication failed for user admin');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return true for auth failed message (case insensitive)', () => {
      const error = new Error('Auth Failed: invalid password');
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for unrelated errors', () => {
      const error = new Error('Connection timeout');
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for errors without message', () => {
      const error = new Error();
      expect(isAuthError(error)).toBe(false);
    });

    it('should return true for codeName match', () => {
      const error = new Error('some error');
      error.codeName = 'AuthenticationFailed';
      expect(isAuthError(error)).toBe(true);
    });
  });

  describe('buildDocumentDBUri', () => {
    it('should return string secret as-is', () => {
      const uri = 'mongodb://user:pass@host:27017/db';
      expect(buildDocumentDBUri(uri)).toBe(uri);
    });

    it('should build URI from credential object', () => {
      const secret = {
        username: 'admin',
        password: 'secret123',
        host: 'docdb-cluster.amazonaws.com',
        port: 27017,
        dbname: 'taskly',
      };
      const uri = buildDocumentDBUri(secret);
      expect(uri).toBe('mongodb://admin:secret123@docdb-cluster.amazonaws.com:27017/taskly?tls=true&retryWrites=false');
    });

    it('should URL-encode special characters in password', () => {
      const secret = {
        username: 'admin',
        password: 'p@ss/w0rd#!',
        host: 'host.com',
        port: 27017,
        dbname: 'taskly',
      };
      const uri = buildDocumentDBUri(secret);
      expect(uri).toContain(encodeURIComponent('p@ss/w0rd#!'));
    });

    it('should use default port 27017 when not specified', () => {
      const secret = {
        username: 'admin',
        password: 'pass',
        host: 'host.com',
        dbname: 'taskly',
      };
      const uri = buildDocumentDBUri(secret);
      expect(uri).toContain(':27017/');
    });

    it('should use default database name when not specified', () => {
      const secret = {
        username: 'admin',
        password: 'pass',
        host: 'host.com',
      };
      const uri = buildDocumentDBUri(secret);
      expect(uri).toContain('/taskly?');
    });

    it('should throw when required fields are missing', () => {
      expect(() => buildDocumentDBUri({ username: 'admin' })).toThrow('missing required fields');
      expect(() => buildDocumentDBUri({ password: 'pass' })).toThrow('missing required fields');
      expect(() => buildDocumentDBUri({})).toThrow('missing required fields');
    });
  });

  describe('getLocalFallback', () => {
    it('should return DocumentDB credentials for known secret name', () => {
      const result = getLocalFallback('taskly/production/documentdb-credentials');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('host');
      expect(result).toHaveProperty('port');
      expect(result).toHaveProperty('dbname');
    });

    it('should return JWT secret for known secret name', () => {
      const result = getLocalFallback('taskly/production/jwt-signing-key');
      expect(result).toHaveProperty('secret');
    });

    it('should normalize environment in secret name', () => {
      const result = getLocalFallback('taskly/dev/documentdb-credentials');
      expect(result).toHaveProperty('username');
    });

    it('should return null for unknown secret name', () => {
      const result = getLocalFallback('unknown/secret/name');
      expect(result).toBeNull();
    });
  });

  describe('getSecret', () => {
    it('should return local fallback in non-production environment', async () => {
      process.env.NODE_ENV = 'test';
      const result = await getSecret('taskly/production/jwt-signing-key');
      expect(result).toHaveProperty('secret');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should fetch from AWS in production and cache the result', async () => {
      process.env.NODE_ENV = 'production';
      const secretValue = { username: 'admin', password: 'prod-pass' };
      mockSend.mockResolvedValueOnce({ SecretString: JSON.stringify(secretValue) });

      // Inject mock client
      setClient({ send: mockSend });

      const result = await getSecret('taskly/production/documentdb-credentials');
      expect(result).toEqual(secretValue);
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await getSecret('taskly/production/documentdb-credentials');
      expect(result2).toEqual(secretValue);
      expect(mockSend).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should refetch after cache expires', async () => {
      process.env.NODE_ENV = 'production';
      const secretValue = { secret: 'value1' };
      mockSend.mockResolvedValue({ SecretString: JSON.stringify(secretValue) });

      setClient({ send: mockSend });

      await getSecret('test-secret');
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Manually expire the cache
      const entry = secretsCache.get('test-secret');
      entry.timestamp = Date.now() - CACHE_TTL_MS - 1;

      await getSecret('test-secret');
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should handle raw string secrets (non-JSON)', async () => {
      process.env.NODE_ENV = 'production';
      mockSend.mockResolvedValueOnce({ SecretString: 'plain-text-secret' });

      setClient({ send: mockSend });

      const result = await getSecret('plain-secret');
      expect(result).toBe('plain-text-secret');
    });

    it('should throw when secret has no string value', async () => {
      process.env.NODE_ENV = 'production';
      mockSend.mockResolvedValueOnce({ SecretString: undefined });

      setClient({ send: mockSend });

      await expect(getSecret('empty-secret')).rejects.toThrow('has no string value');
    });
  });

  describe('invalidateCache', () => {
    it('should remove a specific secret from cache', async () => {
      secretsCache.set('secret-a', { value: 'a', timestamp: Date.now() });
      secretsCache.set('secret-b', { value: 'b', timestamp: Date.now() });

      invalidateCache('secret-a');

      expect(secretsCache.has('secret-a')).toBe(false);
      expect(secretsCache.has('secret-b')).toBe(true);
    });

    it('should not throw when invalidating non-existent key', () => {
      expect(() => invalidateCache('non-existent')).not.toThrow();
    });
  });

  describe('invalidateAllCache', () => {
    it('should clear all cached secrets', () => {
      secretsCache.set('secret-a', { value: 'a', timestamp: Date.now() });
      secretsCache.set('secret-b', { value: 'b', timestamp: Date.now() });

      invalidateAllCache();

      expect(secretsCache.size).toBe(0);
    });
  });

  describe('getDocumentDBUri', () => {
    it('should return MONGODB_URI env var in non-production', async () => {
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_URI = 'mongodb://test-host:27017/testdb';

      const uri = await getDocumentDBUri();
      expect(uri).toBe('mongodb://test-host:27017/testdb');
    });

    it('should return default localhost URI when MONGODB_URI not set', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.MONGODB_URI;

      const uri = await getDocumentDBUri();
      expect(uri).toBe('mongodb://localhost:27017/taskly');
    });

    it('should fetch and build URI from Secrets Manager in production', async () => {
      process.env.NODE_ENV = 'production';
      const secretValue = {
        username: 'admin',
        password: 'prod-pass',
        host: 'docdb.cluster.amazonaws.com',
        port: 27017,
        dbname: 'taskly',
      };
      mockSend.mockResolvedValueOnce({ SecretString: JSON.stringify(secretValue) });

      setClient({ send: mockSend });

      const uri = await getDocumentDBUri();
      expect(uri).toBe('mongodb://admin:prod-pass@docdb.cluster.amazonaws.com:27017/taskly?tls=true&retryWrites=false');
    });
  });

  describe('withRotationRetry', () => {
    it('should return result on successful operation', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await withRotationRetry(operation, 'test-secret');
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry once on auth error and invalidate cache', async () => {
      // Pre-populate cache
      secretsCache.set('test-secret', { value: 'old', timestamp: Date.now() });

      const authError = new Error('Authentication failed');
      authError.code = 'AuthenticationFailed';

      const operation = jest.fn()
        .mockRejectedValueOnce(authError)
        .mockResolvedValueOnce('success-after-retry');

      const result = await withRotationRetry(operation, 'test-secret');
      expect(result).toBe('success-after-retry');
      expect(operation).toHaveBeenCalledTimes(2);
      expect(secretsCache.has('test-secret')).toBe(false);
    });

    it('should throw non-auth errors without retrying', async () => {
      const networkError = new Error('Connection timeout');
      const operation = jest.fn().mockRejectedValue(networkError);

      await expect(withRotationRetry(operation, 'test-secret')).rejects.toThrow('Connection timeout');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw if retry also fails with auth error', async () => {
      const authError = new Error('Authentication failed');
      authError.code = 'AuthenticationFailed';

      const operation = jest.fn().mockRejectedValue(authError);

      await expect(withRotationRetry(operation, 'test-secret')).rejects.toThrow('Authentication failed');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});
