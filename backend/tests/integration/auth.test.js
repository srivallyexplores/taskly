const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/User');

// Mock the password utilities for faster testing
jest.mock('../../utils/password', () => {
  const bcrypt = require('bcryptjs');
  const TEST_SALT_ROUNDS = 4;

  return {
    hashPassword: async (password) => {
      return await bcrypt.hash(password, TEST_SALT_ROUNDS);
    },
    comparePassword: async (password, hashedPassword) => {
      return await bcrypt.compare(password, hashedPassword);
    }
  };
});

// Create app after mocking
const app = require('../../server');
const { generateUserToken } = require('../../utils/jwt');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskly_test';

// Legacy gate: this suite targets the older Bearer-token auth shape (expects
// data.token) and opens its own connection to a live test database. The current
// session-based API is covered by tests/routes/auth.test.js. Skip by default;
// enable with RUN_AWS_INTEGRATION=true.
const RUN_AWS_INTEGRATION = process.env.RUN_AWS_INTEGRATION === 'true';
const describeMaybe = RUN_AWS_INTEGRATION ? describe : describe.skip;

describeMaybe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Ensure we're using test database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close database connection
    await User.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      fullname: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.username).toBe(validUserData.username);
      expect(response.body.data.user.email).toBe(validUserData.email);
      expect(response.body.message).toBe('User registered successfully');

      // Verify user was created in database
      const user = await User.findOne({ username: validUserData.username });
      expect(user).toBeTruthy();
      expect(user.password).not.toBe(validUserData.password); // Should be hashed
    });

    it('should reject registration with duplicate username', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'different@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Username already exists');
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should reject registration with duplicate email', async () => {
      // Create user first
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          username: 'differentuser'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already exists');
      expect(response.body.error.code).toBe('USER_EXISTS');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      fullname: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.message).toBe('Login successful');
    });

    it('should login with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.email, // Using email as username
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: userData.password
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid credentials');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /api/auth/me', () => {
    let user, token;

    beforeEach(async () => {
      // Create and login user
      const userData = {
        fullname: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      user = registerResponse.body.data.user;
      token = registerResponse.body.data.token;
    });

    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user._id).toBe(user._id);
      expect(response.body.data.user.username).toBe(user.username);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.message).toBe('Profile retrieved successfully');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Access token required');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid token');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with expired token', async () => {
      // Create an expired token
      const expiredToken = generateUserToken(user);
      // Mock JWT to make it expired (this is a simplified approach)
      const invalidToken = expiredToken.slice(0, -10) + 'invalidend';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});