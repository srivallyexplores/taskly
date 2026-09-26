/**
 * Test helpers for session-based authentication.
 *
 * The Taskly backend authenticates the frontend via Passport sessions
 * (cookie-based). These helpers register and/or log in a user through the real
 * `/api/auth` endpoints and return a supertest agent that carries the session
 * cookie, so authenticated-route tests exercise the actual auth path (including
 * the session fallback in `authenticateToken`).
 */

import request from 'supertest';
import app from '../../server.js';
import User from '../../models/User.js';

let userCounter = 0;

/**
 * Build a unique, valid registration payload.
 * @param {Object} overrides
 */
export function buildUserPayload(overrides = {}) {
  userCounter += 1;
  const n = `${Date.now()}${userCounter}`.slice(-8);
  return {
    fullname: 'Test User',
    username: `user${n}`,
    email: `user${n}@example.com`,
    password: 'password123',
    ...overrides,
  };
}

/**
 * Register a user and return an authenticated supertest agent plus the created
 * user document and the payload used.
 *
 * @param {Object} overrides - fields to override on the registration payload
 * @returns {Promise<{ agent, user, payload }>}
 */
export async function registerAndLogin(overrides = {}) {
  const payload = buildUserPayload(overrides);
  const agent = request.agent(app);

  const res = await agent.post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(
      `registerAndLogin failed: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  // Registration auto-logs-in (req.logIn), so the agent now holds the session.
  const user = await User.findOne({ username: payload.username });
  return { agent, user, payload };
}

export default { buildUserPayload, registerAndLogin };
