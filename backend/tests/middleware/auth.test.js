/**
 * Unit tests for authenticateToken (backend/middleware/auth.js).
 *
 * Covers the auth-unification behavior:
 *  (a) valid Passport session, no Bearer token  -> next() (session fallback)
 *  (b) no session and no token                   -> 401
 *  (c) valid local JWT (Cognito disabled)        -> authenticates
 *  (d) Cognito enabled                           -> session fallback NOT used
 *
 * The User model and jsonwebtoken are mocked; no live DB is required.
 */

jest.mock('../../models/User');
jest.mock('jsonwebtoken');

const jwtModule = require('jsonwebtoken');
const jwt = jwtModule.default || jwtModule;
const UserModule = require('../../models/User');
const User = UserModule.default || UserModule;
const { authenticateToken } = require('../../middleware/auth');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function makeReq({ authHeader, isAuthenticated, user } = {}) {
  const headers = {};
  if (authHeader !== undefined) headers.Authorization = authHeader;
  return {
    header: (name) => headers[name] || headers[name.toLowerCase()],
    isAuthenticated:
      isAuthenticated === undefined ? undefined : () => isAuthenticated,
    user: user || undefined,
  };
}

describe('authenticateToken', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_CLIENT_ID;
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('(a) authenticates a valid Passport session when no Bearer token is present', async () => {
    const sessionUser = { _id: 'u1', username: 'alice' };
    const req = makeReq({ isAuthenticated: true, user: sessionUser });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toBe(sessionUser);
  });

  it('(b) rejects with 401 when there is no session and no token', async () => {
    const req = makeReq({ isAuthenticated: false });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
  });

  it('(b2) rejects with 401 when req.isAuthenticated is not available and no token', async () => {
    const req = makeReq({});
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('(c) authenticates with a valid local JWT (Cognito disabled)', async () => {
    const dbUser = { _id: 'u2', username: 'bob' };
    jwt.verify.mockReturnValue({ id: 'u2' });
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(dbUser),
    });

    const req = makeReq({ authHeader: 'Bearer valid-token' });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(req.user).toBe(dbUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('(c2) rejects an invalid local JWT with 401', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const req = makeReq({ authHeader: 'Bearer bad-token' });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('(d) does NOT use session fallback when Cognito is enabled', async () => {
    process.env.COGNITO_USER_POOL_ID = 'us-east-1_pool';
    process.env.COGNITO_CLIENT_ID = 'client-id';

    // Valid session, but no Bearer token. With Cognito enabled this must be
    // rejected (session fallback disabled to preserve production security).
    const req = makeReq({ isAuthenticated: true, user: { _id: 'u3' } });
    const res = makeRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      })
    );
  });
});
