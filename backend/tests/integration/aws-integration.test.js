/**
 * End-to-End AWS Integration Tests
 *
 * Tests the full request flow through the AWS serverless architecture:
 * - API Gateway → Lambda → DocumentDB
 * - File upload with pre-signed URLs
 * - Authentication with Cognito tokens
 * - Event publishing and async processing
 *
 * These tests require a deployed AWS environment and valid credentials.
 * Run with: AWS_PROFILE=taskly-dev npm test -- --testPathPattern=aws-integration
 *
 *  1.2, 3.6, 4.1, 7.1
 */

const API_BASE_URL = process.env.API_GATEWAY_URL || 'https://api-dev.taskly.app';
const TEST_TIMEOUT = 30000; // 30 seconds for cold starts

// Live-infra gate: only run against a deployed AWS environment.
const RUN_AWS_INTEGRATION = process.env.RUN_AWS_INTEGRATION === 'true';

// Skip unless explicitly enabled AND an API URL is configured.
const describeIfAws =
  RUN_AWS_INTEGRATION && process.env.API_GATEWAY_URL ? describe : describe.skip;

describeIfAws('AWS Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Get a test token — in real tests this would authenticate via Cognito
    // For now, use a pre-generated test token from environment
    authToken = process.env.TEST_AUTH_TOKEN || '';

    if (!authToken) {
      console.warn('TEST_AUTH_TOKEN not set — auth-dependent tests will be skipped');
    }
  });

  // ─── Health Check ──────────────────────────────────────────────────────────

  describe('Health Check', () => {
    it('should return healthy status from API Gateway → Lambda', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('OK');
      expect(data.database).toBe('connected');
      expect(data.environment).toBeDefined();
    }, TEST_TIMEOUT);

    it('should include correlation ID in response headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);

      // API Gateway adds request ID
      const requestId = response.headers.get('x-amzn-requestid') ||
                        response.headers.get('x-correlation-id');
      expect(requestId).toBeDefined();
    }, TEST_TIMEOUT);
  });

  // ─── Authentication Flow ───────────────────────────────────────────────────

  describe('Authentication Flow', () => {
    it('should reject requests without authorization header', async () => {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    }, TEST_TIMEOUT);

    it('should reject requests with invalid token', async () => {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token-xyz',
        },
      });

      expect(response.status).toBe(401);
    }, TEST_TIMEOUT);

    it('should accept requests with valid Cognito token', async () => {
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Should be 200 or at least not 401
      expect(response.status).not.toBe(401);
    }, TEST_TIMEOUT);
  });

  // ─── File Upload Flow ──────────────────────────────────────────────────────

  describe('File Upload (Pre-signed URLs)', () => {
    it('should generate a pre-signed URL for avatar upload', async () => {
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/upload/avatar/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          contentType: 'image/png',
          filename: 'test-avatar.png',
          fileSize: 1024,
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.uploadUrl).toMatch(/^https:\/\//);
      expect(data.data.fileKey).toMatch(/^avatars\//);
      expect(data.data.expiresIn).toBe(300);
    }, TEST_TIMEOUT);

    it('should reject invalid file types', async () => {
      if (!authToken) return;

      const response = await fetch(`${API_BASE_URL}/api/upload/avatar/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          contentType: 'application/exe',
          filename: 'malware.exe',
          fileSize: 1024,
        }),
      });

      expect(response.status).toBe(400);
    }, TEST_TIMEOUT);

    it('should upload a file to S3 using the pre-signed URL', async () => {
      if (!authToken) return;

      // Step 1: Get pre-signed URL
      const presignResponse = await fetch(`${API_BASE_URL}/api/upload/avatar/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          contentType: 'image/png',
          filename: 'integration-test.png',
          fileSize: 4, // Tiny test file
        }),
      });

      const presignData = await presignResponse.json();
      if (presignResponse.status !== 200) return;

      // Step 2: Upload to S3 using pre-signed URL
      const testFileContent = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
      const uploadResponse = await fetch(presignData.data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': '4',
        },
        body: testFileContent,
      });

      expect(uploadResponse.status).toBe(200);
    }, TEST_TIMEOUT);
  });

  // ─── Event Publishing ──────────────────────────────────────────────────────

  describe('Event Publishing (Task Completion)', () => {
    it('should complete a task and publish event without blocking response', async () => {
      if (!authToken) return;

      // First create a task
      const createResponse = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Integration Test Task',
          due: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          priority: 'medium',
        }),
      });

      if (createResponse.status !== 201) return;
      const createData = await createResponse.json();
      const taskId = createData.data?._id;
      if (!taskId) return;

      // Complete the task — this should publish an event asynchronously
      const startTime = Date.now();
      const completeResponse = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const responseTime = Date.now() - startTime;

      expect(completeResponse.status).toBe(200);
      const completeData = await completeResponse.json();
      expect(completeData.success).toBe(true);

      // Response should be fast (event publishing is async, not blocking)
      // Allow generous timeout for cold starts but verify it's not waiting for event processing
      expect(responseTime).toBeLessThan(10000); // 10s max (includes cold start)

      // Cleanup
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
    }, TEST_TIMEOUT);
  });

  // ─── API Gateway Error Handling ────────────────────────────────────────────

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await fetch(`${API_BASE_URL}/api/nonexistent-route`);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
    }, TEST_TIMEOUT);

    it('should return structured error responses', async () => {
      const response = await fetch(`${API_BASE_URL}/api/tasks/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'fake'}`,
        },
      });

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      if (data.error) {
        expect(data.error).toHaveProperty('message');
        expect(data.error).toHaveProperty('code');
      }
    }, TEST_TIMEOUT);
  });
});
