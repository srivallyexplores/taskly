/**
 * Unit Tests — Cognito JWT Authentication Middleware
 *
 * Tests the authenticateToken middleware's ability to:
 * - Validate Cognito JWT tokens (valid, expired, malformed)
 * - Fall back to local JWT validation when Cognito is not configured
 * - Extract user claims from validated tokens
 * - Handle missing/invalid Authorization headers
 *
 *  3.6, 3.7
 */

import { jest } from '@jest/globals';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock User model
const mockFindOne = jest.fn();
const mockFindById = jest.fn();

jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findOne: mockFindOne,
    findById: mockFindById,
  },
}));

// Mock Team model
jest.unstable_mockModule('../../models/Team.js', () => ({
  default: {},
}));

// Mock Project model
jest.unstable_mockModule('../../models/Project.js', () => ({
  default: {},
}));

// Mock jsonwebtoken
const mockJwtVerify = jest.fn();
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockJwtVerify,
  },
}));

// Mock aws-jwt-verify
const mockCognitoVerify = jest.fn();
const mockCognitoCreate = jest.fn().mockReturnValue({
  verify: mockCognitoVerify,
});

jest.unstable_mockModule('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: mockCognitoCreate,
  },
}));

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createMockReq(headers = {}) {
  return {
    header: jest.fn((name) => headers[name] || headers[name.toLowerCase()]),
  };
}

function createMockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function createMockNext() {
  return jest.fn();
}

const mockUser = {
  _id: 'user-123',
  id: 'user-123',
  email: 'test@example.com',
  fullname: 'Test User',
  cognitoSub: 'cognito-sub-abc',
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

// Gated: relies on jest.unstable_mockModule + native ESM, which the current
// babel-CJS Jest transform does not apply. authenticateToken (including the
// Cognito path and local-JWT path) is covered by tests/middleware/auth.test.js.
// Enable with RUN_ESM_MOCK_TESTS=true under native ESM.
const RUN_ESM_MOCK_TESTS = process.env.RUN_ESM_MOCK_TESTS === 'true';
const describeMaybe = RUN_ESM_MOCK_TESTS ? describe : describe.skip;

describeMaybe('Authentication Middleware', () => {
  let authenticateToken, isCognitoEnabled;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset environment
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_CLIENT_ID;
    delete process.env.JWT_SECRET;

    const authModule = await import('../../middleware/auth.js');
    authenticateToken = authModule.authenticateToken;
    isCognitoEnabled = authModule.isCognitoEnabled;
  });

  describe('Missing/Invalid Authorization Header', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Access token required',
            code: 'UNAUTHORIZED',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', async () => {
      const req = createMockReq({ Authorization: 'Basic abc123' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty string', async () => {
      const req = createMockReq({ Authorization: '' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Local JWT Validation (Cognito disabled)', () => {
    beforeEach(() => {
      // Ensure Cognito is not configured
      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;
      process.env.JWT_SECRET = 'test-secret-key';
    });

    it('should authenticate with valid local JWT token', async () => {
      mockJwtVerify.mockReturnValue({ id: 'user-123' });
      mockFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = createMockReq({ Authorization: 'Bearer valid-local-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(mockJwtVerify).toHaveBeenCalledWith('valid-local-token', 'test-secret-key');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for expired local JWT token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const req = createMockReq({ Authorization: 'Bearer expired-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid token',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed local JWT token', async () => {
      mockJwtVerify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const req = createMockReq({ Authorization: 'Bearer not-a-real-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not found in database', async () => {
      mockJwtVerify.mockReturnValue({ id: 'nonexistent-user' });
      mockFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = createMockReq({ Authorization: 'Bearer valid-token-no-user' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'User not found',
          }),
        })
      );
    });
  });

  describe('Cognito JWT Validation', () => {
    beforeEach(() => {
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';
      process.env.AWS_REGION = 'us-east-1';
    });

    it('should authenticate with valid Cognito JWT token', async () => {
      mockCognitoVerify.mockResolvedValue({
        sub: 'cognito-sub-abc',
        email: 'test@example.com',
        'custom:userId': 'user-123',
        token_use: 'access',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      mockFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = createMockReq({ Authorization: 'Bearer valid-cognito-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(req.cognitoClaims).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for expired Cognito token', async () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'JwtExpiredError';
      mockCognitoVerify.mockRejectedValue(expiredError);

      const req = createMockReq({ Authorization: 'Bearer expired-cognito-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid or expired token',
            code: 'UNAUTHORIZED',
          }),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for token with invalid signature', async () => {
      const signatureError = new Error('Invalid signature');
      signatureError.name = 'JwtInvalidSignatureError';
      mockCognitoVerify.mockRejectedValue(signatureError);

      const req = createMockReq({ Authorization: 'Bearer tampered-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid or expired token',
          }),
        })
      );
    });

    it('should return 401 for token with wrong audience (client ID)', async () => {
      const claimError = new Error('Invalid claim: aud');
      claimError.name = 'JwtInvalidClaimError';
      mockCognitoVerify.mockRejectedValue(claimError);

      const req = createMockReq({ Authorization: 'Bearer wrong-audience-token' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Cognito user is not found in database', async () => {
      mockCognitoVerify.mockResolvedValue({
        sub: 'unknown-cognito-sub',
        email: 'unknown@example.com',
        token_use: 'access',
      });

      mockFindOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      mockFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = createMockReq({ Authorization: 'Bearer valid-token-no-db-user' });
      const res = createMockRes();
      const next = createMockNext();

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'User not found',
          }),
        })
      );
    });
  });

  describe('isCognitoEnabled', () => {
    it('should return false when Cognito env vars are not set', () => {
      delete process.env.COGNITO_USER_POOL_ID;
      delete process.env.COGNITO_CLIENT_ID;

      expect(isCognitoEnabled()).toBe(false);
    });

    it('should return false when only COGNITO_USER_POOL_ID is set', () => {
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';
      delete process.env.COGNITO_CLIENT_ID;

      expect(isCognitoEnabled()).toBe(false);
    });

    it('should return true when both Cognito env vars are set', () => {
      process.env.COGNITO_USER_POOL_ID = 'us-east-1_TestPool';
      process.env.COGNITO_CLIENT_ID = 'test-client-id';

      expect(isCognitoEnabled()).toBe(true);
    });
  });
});
