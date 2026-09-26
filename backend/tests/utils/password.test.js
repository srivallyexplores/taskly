// Mock the password utilities to use lower salt rounds for faster testing
jest.mock('../../utils/password', () => {
  const bcrypt = require('bcryptjs');
  const TEST_SALT_ROUNDS = 4; // Much faster for testing

  return {
    hashPassword: async (password) => {
      return await bcrypt.hash(password, TEST_SALT_ROUNDS);
    },
    comparePassword: async (password, hashedPassword) => {
      return await bcrypt.compare(password, hashedPassword);
    }
  };
});

const { hashPassword, comparePassword } = require('../../utils/password');

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should make them different
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password against hash', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('', hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should return false for password against empty hash', async () => {
      const password = 'testpassword123';
      const isMatch = await comparePassword(password, '');

      expect(isMatch).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);
      const isMatch = await comparePassword('testpassword123', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });
});