const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - User data to include in token
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Generate token for user (includes user ID and username)
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateUserToken = (user) => {
  return generateToken({
    id: user._id,
    username: user.username,
    email: user.email,
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateUserToken,
};