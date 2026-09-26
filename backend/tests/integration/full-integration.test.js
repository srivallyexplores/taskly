const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../../models/User');
const Task = require('../../models/Task');

// Live-infra / legacy gate: this suite targets the older Bearer-token API shape
// and expects a live database workflow. Skip by default; enable with
// RUN_AWS_INTEGRATION=true.
const RUN_AWS_INTEGRATION = process.env.RUN_AWS_INTEGRATION === 'true';
const describeMaybe = RUN_AWS_INTEGRATION ? describe : describe.skip;

describeMaybe('Full Integration Tests', () => {
  let authToken;
  let userId;
  let taskId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly-test');
    }
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Complete User Workflow', () => {
    test('Should complete full user registration to task management workflow', async () => {
      // 1. Register a new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.token).toBeDefined();
      
      authToken = registerResponse.body.data.token;
      userId = registerResponse.body.data.user._id;

      // 2. Login with the same user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();

      // 3. Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe('test@example.com');

      // 4. Create a task
      const createTaskResponse = await request(app)
        .post(`/api/users/${userId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: 'high',
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          tags: ['test', 'integration']
        });

      expect(createTaskResponse.status).toBe(201);
      expect(createTaskResponse.body.success).toBe(true);
      expect(createTaskResponse.body.data.title).toBe('Test Task');
      
      taskId = createTaskResponse.body.data._id;

      // 5. Get user's tasks
      const getTasksResponse = await request(app)
        .get(`/api/users/${userId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getTasksResponse.status).toBe(200);
      expect(getTasksResponse.body.success).toBe(true);
      expect(getTasksResponse.body.data.items).toHaveLength(1);
      expect(getTasksResponse.body.data.items[0].title).toBe('Test Task');

      // 6. Update the task
      const updateTaskResponse = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          description: 'This task has been updated',
          priority: 'medium'
        });

      expect(updateTaskResponse.status).toBe(200);
      expect(updateTaskResponse.body.success).toBe(true);
      expect(updateTaskResponse.body.data.title).toBe('Updated Test Task');

      // 7. Complete the task
      const completeTaskResponse = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(completeTaskResponse.status).toBe(200);
      expect(completeTaskResponse.body.success).toBe(true);
      expect(completeTaskResponse.body.data.status).toBe('completed');

      // 8. Get user statistics
      const statsResponse = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
      expect(statsResponse.body.data.totalTasks).toBe(1);
      expect(statsResponse.body.data.completedTasks).toBe(1);

      // 9. Update user profile
      const updateProfileResponse = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        });

      expect(updateProfileResponse.status).toBe(200);
      expect(updateProfileResponse.body.success).toBe(true);
      expect(updateProfileResponse.body.data.firstName).toBe('Updated');

      // 10. Delete the task
      const deleteTaskResponse = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteTaskResponse.status).toBe(200);
      expect(deleteTaskResponse.body.success).toBe(true);
    });

    test('Should handle authentication errors properly', async () => {
      // Test accessing protected route without token
      const noTokenResponse = await request(app)
        .get('/api/auth/me');

      expect(noTokenResponse.status).toBe(401);
      expect(noTokenResponse.body.success).toBe(false);

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(invalidTokenResponse.status).toBe(401);
      expect(invalidTokenResponse.body.success).toBe(false);
    });

    test('Should handle validation errors properly', async () => {
      // Register user first
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = registerResponse.body.data.token;
      const userId = registerResponse.body.data.user._id;

      // Test creating task with invalid data
      const invalidTaskResponse = await request(app)
        .post(`/api/users/${userId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Empty title should fail validation
          priority: 'invalid-priority'
        });

      expect(invalidTaskResponse.status).toBe(400);
      expect(invalidTaskResponse.body.success).toBe(false);
    });
  });

  describe('API Health and Configuration', () => {
    test('Should return health status', async () => {
      const healthResponse = await request(app)
        .get('/api/health');

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('OK');
      expect(healthResponse.body.database).toBeDefined();
      expect(healthResponse.body.environment).toBeDefined();
    });

    test('Should handle CORS properly', async () => {
      const corsResponse = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(corsResponse.status).toBe(200);
    });

    test('Should return 404 for non-existent routes', async () => {
      const notFoundResponse = await request(app)
        .get('/api/non-existent-route');

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.body.success).toBe(false);
      expect(notFoundResponse.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Data Consistency Tests', () => {
    test('Should maintain data consistency across operations', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'consistencytest',
          email: 'consistency@example.com',
          password: 'password123',
          firstName: 'Consistency',
          lastName: 'Test'
        });

      const token = registerResponse.body.data.token;
      const userId = registerResponse.body.data.user._id;

      // Create multiple tasks
      const tasks = [];
      for (let i = 0; i < 3; i++) {
        const taskResponse = await request(app)
          .post(`/api/users/${userId}/tasks`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: `Task ${i + 1}`,
            description: `Description for task ${i + 1}`,
            priority: i === 0 ? 'high' : i === 1 ? 'medium' : 'low',
            dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString()
          });

        expect(taskResponse.status).toBe(201);
        tasks.push(taskResponse.body.data);
      }

      // Complete first task
      await request(app)
        .patch(`/api/tasks/${tasks[0]._id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      // Get updated statistics
      const statsResponse = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(statsResponse.body.data.totalTasks).toBe(3);
      expect(statsResponse.body.data.completedTasks).toBe(1);
      expect(statsResponse.body.data.completionRate).toBe(33.33);

      // Verify task counts in user tasks endpoint
      const userTasksResponse = await request(app)
        .get(`/api/users/${userId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(userTasksResponse.body.data.items).toHaveLength(3);
      expect(userTasksResponse.body.data.pagination.totalItems).toBe(3);

      // Delete one task and verify consistency
      await request(app)
        .delete(`/api/tasks/${tasks[1]._id}`)
        .set('Authorization', `Bearer ${token}`);

      const updatedStatsResponse = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(updatedStatsResponse.body.data.totalTasks).toBe(2);
      expect(updatedStatsResponse.body.data.completedTasks).toBe(1);
    });
  });
});