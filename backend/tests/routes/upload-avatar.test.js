/**
 * Tests for POST /api/upload/avatar (Cloudinary multipart avatar upload).
 *
 * config/cloudinary.js is mocked so:
 *  - `upload.single('avatar')` is a passthrough middleware that sets req.file
 *    (multer-storage-cloudinary sets req.file.path = secure_url,
 *     req.file.filename = public_id)
 *  - `validateCloudinaryConfig()` return value is controllable per-test.
 *
 * Authentication uses a real session agent, so this also validates the
 * session-fallback in authenticateToken. No live Cloudinary calls are made.
 */

// Controllable mock state (mutated per-test).
const cloudinaryMockState = {
  configOk: true,
  file: {
    path: 'https://res.cloudinary.com/test/image/upload/v1/taskly/avatars/abc.png',
    filename: 'taskly/avatars/abc',
  },
};

jest.mock('../../config/cloudinary.js', () => ({
  __esModule: true,
  validateCloudinaryConfig: () =>
    cloudinaryMockState.configOk
      ? { success: true }
      : { success: false, error: 'Cloudinary not configured' },
  upload: {
    single: () => (req, res, next) => {
      req.file = cloudinaryMockState.file;
      next();
    },
  },
  cloudinary: {},
  deleteImage: jest.fn(),
  uploadImage: jest.fn(),
  default: {},
}));

const request = require('supertest');
const app = require('../../server.js').default;
const User = require('../../models/User.js').default;
const { registerAndLogin } = require('../helpers/authAgent.js');

describe('POST /api/upload/avatar (Cloudinary)', () => {
  beforeEach(() => {
    // Reset mock state to the default success case before each test.
    cloudinaryMockState.configOk = true;
    cloudinaryMockState.file = {
      path: 'https://res.cloudinary.com/test/image/upload/v1/taskly/avatars/abc.png',
      filename: 'taskly/avatars/abc',
    };
  });

  it('uploads an avatar and persists avatar + avatarPublicId to the user', async () => {
    const { agent, user } = await registerAndLogin();

    const res = await agent
      .post('/api/upload/avatar')
      .attach('avatar', Buffer.from('fake-image-bytes'), 'avatar.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.avatar).toBe(cloudinaryMockState.file.path);
    expect(res.body.data.publicId).toBe(cloudinaryMockState.file.filename);

    const updated = await User.findById(user._id);
    expect(updated.avatar).toBe(cloudinaryMockState.file.path);
    expect(updated.avatarPublicId).toBe(cloudinaryMockState.file.filename);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/upload/avatar')
      .attach('avatar', Buffer.from('x'), 'avatar.png');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 503 CLOUDINARY_NOT_CONFIGURED when Cloudinary is not configured', async () => {
    cloudinaryMockState.configOk = false;

    const { agent } = await registerAndLogin();

    const res = await agent
      .post('/api/upload/avatar')
      .attach('avatar', Buffer.from('x'), 'avatar.png');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CLOUDINARY_NOT_CONFIGURED');
  });
});
