/**
 * Email service tests (Resend) — mocked SDK.
 *
 * Verifies config/resend.js:
 *  - degrades gracefully when RESEND_API_KEY is unset (no throw, structured
 *    failure with code EMAIL_SERVICE_NOT_CONFIGURED)
 *  - when configured, calls resend.emails.send with { from, to, subject, html, text }
 *
 * The 'resend' SDK is mocked; no real network calls or API keys are used.
 */

// Mock the Resend SDK so no real emails are sent.
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Import after the mock is registered (babel transforms ESM -> CJS).
const { sendEmail } = require('../config/resend.js');
const { welcomeEmail, passwordResetEmail } = require('../utils/emailTemplates.js');

describe('Email service (config/resend.js)', () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalApiKey;
    }
    if (originalFrom === undefined) {
      delete process.env.EMAIL_FROM;
    } else {
      process.env.EMAIL_FROM = originalFrom;
    }
  });

  describe('graceful degradation (unconfigured)', () => {
    it('returns a structured failure and does not call the SDK when RESEND_API_KEY is unset', async () => {
      delete process.env.RESEND_API_KEY;

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Hi</p>',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('EMAIL_SERVICE_NOT_CONFIGURED');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('configured send', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-resend-key';
      process.env.EMAIL_FROM = 'Taskly <noreply@test.dev>';
    });

    it('calls resend.emails.send with { from, to, subject, html, text } and reports success', async () => {
      mockSend.mockResolvedValueOnce({ id: 'email-123' });

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Welcome',
        html: '<h1>Welcome</h1>',
        text: 'Welcome',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('email-123');
      expect(mockSend).toHaveBeenCalledTimes(1);

      const args = mockSend.mock.calls[0][0];
      expect(args).toEqual(
        expect.objectContaining({
          from: 'Taskly <noreply@test.dev>',
          to: 'user@example.com',
          subject: 'Welcome',
          html: '<h1>Welcome</h1>',
          text: 'Welcome',
        })
      );
    });

    it('derives a plain-text body from HTML when text is not provided', async () => {
      mockSend.mockResolvedValueOnce({ id: 'email-456' });

      await sendEmail({
        to: 'user@example.com',
        subject: 'No text',
        html: '<p>Hello <b>world</b></p>',
      });

      const args = mockSend.mock.calls[0][0];
      expect(typeof args.text).toBe('string');
      expect(args.text).not.toContain('<');
    });

    it('returns a structured failure (no throw) when the SDK rejects', async () => {
      mockSend.mockRejectedValueOnce(new Error('network down'));

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Boom',
        html: '<p>x</p>',
      });

      expect(result.success).toBe(false);
      expect(result.code).toBe('EMAIL_SEND_ERROR');
      expect(result.error).toContain('network down');
    });
  });

  describe('email templates', () => {
    it('welcomeEmail returns a subject and html', () => {
      const tpl = welcomeEmail('Jane', 'jane@example.com');
      expect(tpl.subject).toBeDefined();
      expect(tpl.html).toContain('Jane');
    });

    it('passwordResetEmail includes the reset link', () => {
      const link = 'http://localhost:3000/reset-password/token123';
      const tpl = passwordResetEmail('Jane', link);
      expect(tpl.subject).toBeDefined();
      expect(tpl.html).toContain(link);
    });
  });
});
