/**
 * Unit Tests — S3 Pre-signed URL Generation
 *
 * Tests the upload routes' ability to:
 * - Generate pre-signed URLs with correct parameters
 * - Validate file types and sizes
 * - Generate unique S3 keys
 *
 *  4.1, 4.2, 4.3
 */

import { jest } from '@jest/globals';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockGetSignedUrl = jest.fn().mockResolvedValue('https://s3.amazonaws.com/presigned-url');
const mockSend = jest.fn().mockResolvedValue({});

jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ input: params })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ input: params })),
  S3Client: jest.fn(),
}));

jest.unstable_mockModule('../../config/aws.js', () => ({
  s3Client: { send: mockSend },
}));

// Mock auth middleware to pass through
jest.unstable_mockModule('../../middleware/auth.js', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { _id: 'user-123', id: 'user-123' };
    next();
  },
}));

// Mock User model
jest.unstable_mockModule('../../models/User.js', () => ({
  default: {
    findById: jest.fn().mockResolvedValue({
      _id: 'user-123',
      avatar: null,
      avatarS3Key: null,
      save: jest.fn().mockResolvedValue(true),
    }),
  },
}));

// ─── Test Suite ──────────────────────────────────────────────────────────────

// Gated: relies on jest.unstable_mockModule + native ESM, which the current
// babel-CJS Jest transform does not apply. The avatar upload route is covered
// by tests/routes/upload-avatar.test.js. Enable with RUN_ESM_MOCK_TESTS=true
// under native ESM (NODE_OPTIONS=--experimental-vm-modules).
const RUN_ESM_MOCK_TESTS = process.env.RUN_ESM_MOCK_TESTS === 'true';
const describeMaybe = RUN_ESM_MOCK_TESTS ? describe : describe.skip;

describeMaybe('S3 Pre-signed URL Generation', () => {
  let request;
  let app;

  beforeAll(async () => {
    const express = (await import('express')).default;
    const supertest = (await import('supertest')).default;
    const uploadRoutes = (await import('../../routes/upload.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/upload', uploadRoutes);

    request = supertest(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSignedUrl.mockResolvedValue('https://taskly-uploads.s3.amazonaws.com/presigned-url');
  });

  describe('POST /api/upload/avatar/presign', () => {
    it('should generate a pre-signed URL for valid avatar upload', async () => {
      const response = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        filename: 'avatar.png',
        fileSize: 1024 * 1024, // 1MB
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uploadUrl');
      expect(response.body.data).toHaveProperty('fileKey');
      expect(response.body.data).toHaveProperty('publicUrl');
      expect(response.body.data).toHaveProperty('expiresIn', 300);
    });

    it('should include correct S3 key prefix with user ID', async () => {
      const response = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/jpeg',
        filename: 'photo.jpg',
        fileSize: 500000,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.fileKey).toMatch(/^avatars\/user-123\/original\//);
      expect(response.body.data.fileKey).toMatch(/\.jpg$/);
    });

    it('should reject invalid file types for avatars', async () => {
      const response = await request.post('/api/upload/avatar/presign').send({
        contentType: 'application/pdf',
        filename: 'document.pdf',
        fileSize: 1024,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject files exceeding 5MB for avatars', async () => {
      const response = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        filename: 'large-avatar.png',
        fileSize: 6 * 1024 * 1024, // 6MB
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        // missing filename and fileSize
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept all valid avatar MIME types', async () => {
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      for (const contentType of validTypes) {
        const response = await request.post('/api/upload/avatar/presign').send({
          contentType,
          filename: `test.${contentType.split('/')[1]}`,
          fileSize: 1024,
        });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('POST /api/upload/attachment/presign', () => {
    it('should generate a pre-signed URL for valid attachment upload', async () => {
      const response = await request.post('/api/upload/attachment/presign').send({
        contentType: 'application/pdf',
        filename: 'report.pdf',
        fileSize: 5 * 1024 * 1024, // 5MB
        taskId: 'task-456',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fileKey).toMatch(/^attachments\/task-456\//);
    });

    it('should reject attachments exceeding 25MB', async () => {
      const response = await request.post('/api/upload/attachment/presign').send({
        contentType: 'application/zip',
        filename: 'large-file.zip',
        fileSize: 26 * 1024 * 1024, // 26MB
        taskId: 'task-456',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should return 400 when taskId is missing', async () => {
      const response = await request.post('/api/upload/attachment/presign').send({
        contentType: 'application/pdf',
        filename: 'report.pdf',
        fileSize: 1024,
        // missing taskId
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Pre-signed URL Parameters', () => {
    it('should call getSignedUrl with correct bucket and expiry', async () => {
      await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        filename: 'test.png',
        fileSize: 1024,
      });

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // s3Client
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: expect.any(String),
            ContentType: 'image/png',
            ContentLength: 1024,
          }),
        }),
        expect.objectContaining({
          expiresIn: 300,
        })
      );
    });

    it('should generate unique file keys for each request', async () => {
      const response1 = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        filename: 'test.png',
        fileSize: 1024,
      });

      const response2 = await request.post('/api/upload/avatar/presign').send({
        contentType: 'image/png',
        filename: 'test.png',
        fileSize: 1024,
      });

      expect(response1.body.data.fileKey).not.toBe(response2.body.data.fileKey);
    });
  });
});
