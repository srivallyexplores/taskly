/**
 * Auth route tests — exercise the REAL session-based API.
 *
 * The backend uses Passport sessions (no Bearer token is returned by
 * register/login). These tests register/login via the real endpoints using a
 * supertest agent that carries the session cookie, and assert on the actual
 * response shapes ({ success, data, message } / { success:false, error }).
 *
 * They will fail if the auth handlers or the session-fallback in
 * authenticateToken are reverted.
 */

import request from 'supertest';
import app from '../../server.js';
import User from '../../models/User.js';
import { buildUserPayload, registerAndLogin } from '../helpers/authAgent.js';

describe('Auth Routes (session-based)', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and auto-logs-in', async () => {
      const payload = buildUserPayload();

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(payload.username);
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.user.fullname).toBe(payload.fullname);
      // Password must never be returned.
      expect(res.body.data.user.password).toBeUndefined();

      const inDb = await User.findOne({ username: payload.username });
      expect(inDb).not.toBeNull();
      // Password should be hashed, not stored in plaintext.
      expect(inDb.password).not.toBe(payload.password);
    });

    it('rejects duplicate username', async () => {
      const payload = buildUserPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...payload, email: `other${Date.now()}@example.com` });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_EXISTS');
      expect(res.body.error.message).toBe('Username already exists');
    });

    it('rejects duplicate email', async () => {
      const payload = buildUserPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...payload, username: `u${Date.now()}`.slice(0, 20) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_EXISTS');
      expect(res.body.error.message).toBe('Email already exists');
    });

    it('rejects registration with missing required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(buildUserPayload({ email: 'not-an-email' }));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('does NOT change the caller session when an authenticated admin creates a user', async () => {
      // An admin is logged in via a session agent.
      const { agent, payload: adminPayload } = await registerAndLogin();

      // Sanity: the agent is authenticated as the admin.
      const before = await agent.get('/api/auth/me');
      expect(before.status).toBe(200);
      expect(before.body.data.user.username).toBe(adminPayload.username);

      // The admin creates a new user through the SAME authenticated agent.
      const newUserPayload = buildUserPayload();
      const createRes = await agent
        .post('/api/auth/register')
        .send(newUserPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.user.username).toBe(newUserPayload.username);

      // The new user must exist...
      const created = await User.findOne({ username: newUserPayload.username });
      expect(created).not.toBeNull();

      // ...but the admin's session must be untouched: /me still returns the admin,
      // NOT the newly created user. (Reverting the admin-create guard turns this red.)
      const after = await agent.get('/api/auth/me');
      expect(after.status).toBe(200);
      expect(after.body.data.user.username).toBe(adminPayload.username);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid username and password', async () => {
      const payload = buildUserPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: payload.username, password: payload.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(payload.username);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('logs in using the email as the username field', async () => {
      const payload = buildUserPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: payload.email, password: payload.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects invalid credentials', async () => {
      const payload = buildUserPayload();
      await request(app).post('/api/auth/register').send(payload);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: payload.username, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login with missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for an authenticated session (no Bearer token)', async () => {
      const { agent, payload } = await registerAndLogin();

      const res = await agent.get('/api/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(payload.username);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('rejects an unauthenticated request (no session, no token)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('ends the session so protected routes reject afterwards', async () => {
      const { agent } = await registerAndLogin();

      // Sanity check: authenticated before logout.
      const before = await agent.get('/api/auth/me');
      expect(before.status).toBe(200);

      const logout = await agent.post('/api/auth/logout');
      expect(logout.status).toBe(200);
      expect(logout.body.success).toBe(true);

      const after = await agent.get('/api/auth/me');
      expect(after.status).toBe(401);
    });
  });
});
