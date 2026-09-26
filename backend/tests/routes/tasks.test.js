/**
 * Task route tests — exercise the REAL user-scoped task API.
 *
 * Tasks are created/listed under a user: POST/GET /api/users/:userId/tasks.
 * Authentication is session-based via a supertest agent. The create payload
 * matches createTaskSchema: { title, due, priority, ... }.
 *
 * These tests fail if the task handlers or session auth are reverted.
 */

import request from 'supertest';
import app from '../../server.js';
import { registerAndLogin } from '../helpers/authAgent.js';

function futureDate(daysAhead = 7) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
}

describe('Task Routes (user-scoped, session auth)', () => {
  describe('POST /api/users/:userId/tasks', () => {
    it('creates a task for the authenticated user', async () => {
      const { agent, user } = await registerAndLogin();

      const taskData = {
        title: 'Write integration tests',
        due: futureDate(),
        priority: 'medium',
        description: 'Cover the task API',
      };

      const res = await agent
        .post(`/api/users/${user._id}/tasks`)
        .send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(taskData.title);
      expect(res.body.data.priority).toBe(taskData.priority);
      expect(res.body.data.user).toBeDefined();
    });

    it('requires authentication', async () => {
      const { user } = await registerAndLogin();

      const res = await request(app)
        .post(`/api/users/${user._id}/tasks`)
        .send({ title: 'Nope', due: futureDate(), priority: 'low' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('validates required fields', async () => {
      const { agent, user } = await registerAndLogin();

      const res = await agent.post(`/api/users/${user._id}/tasks`).send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an invalid priority', async () => {
      const { agent, user } = await registerAndLogin();

      const res = await agent.post(`/api/users/${user._id}/tasks`).send({
        title: 'Bad priority',
        due: futureDate(),
        priority: 'urgent',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:userId/tasks', () => {
    it('lists tasks for the user with pagination metadata', async () => {
      const { agent, user } = await registerAndLogin();

      // Create a few tasks.
      for (let i = 0; i < 3; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await agent.post(`/api/users/${user._id}/tasks`).send({
          title: `Task ${i}`,
          due: futureDate(i + 1),
          priority: 'low',
        });
      }

      const res = await agent.get(`/api/users/${user._id}/tasks`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.tasks.length).toBe(3);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.totalItems).toBe(3);
    });

    it('requires authentication to list tasks', async () => {
      const { user } = await registerAndLogin();

      const res = await request(app).get(`/api/users/${user._id}/tasks`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
