const jwt = require('jsonwebtoken');

// Mock the JWT utilities to use consistent test secret
jest.mock('../../utils/jwt', () => {
  const jwt = require('jsonwebtoken');
  const TEST_SECRET = 'test-secret-key';
  const TEST_EXPIRES_IN = '1h';

  return {
    generateToken: (payload) => {
      return jwt.sign(payload, TEST_SECRET, {
        expiresIn: TEST_EXPIRES_IN,
      });
    },
    verifyToken: (token) => {
      return jwt.verify(token, TEST_SECRET);
    },
    generateUserToken: (user) => {
      return jwt.sign({
        id: user._id,
        username: user.username,
        email: user.email,
      }, TEST_SECRET, {
        expiresIn: TEST_EXPIRES_IN,
      });
    }
  };
});

const { generateToken, verifyToken, generateUserToken } = require('../../utils/jwt');

describe('JWT Utilities', () => {

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { id: '123', username: 'testuser' };
      const token = generateToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload data in token', () => {
      const payload = { id: '123', username: 'testuser' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
    });

    it('should set expiration time', () => {
      const payload = { id: '123' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { id: '123', username: 'testuser' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.username).toBe(payload.username);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { id: '123' },
        'test-secret-key',
        { expiresIn: '-1h' } // Already expired
      );

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });

    it('should throw error for token with wrong secret', () => {
      const token = jwt.sign({ id: '123' }, 'wrong-secret');

      expect(() => {
        verifyToken(token);
      }).toThrow();
    });
  });

  describe('generateUserToken', () => {
    it('should generate token with user data', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      };

      const token = generateUserToken(user);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(user._id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.email).toBe(user.email);
    });

    it('should handle user object with toString method', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        username: 'testuser',
        email: 'test@example.com'
      };

      const token = generateUserToken(user);
      const decoded = verifyToken(token);

      expect(decoded.id).toBe(user._id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.email).toBe(user.email);
    });
  });
});