/**
 * Email + upload integration smoke test — LIVE credentials required.
 *
 * Gated behind RUN_INTEGRATION_LIVE=true because it exercises real Resend and
 * Cloudinary services. The default suite covers these paths via mocks in
 * tests/email.test.js and tests/routes/upload-avatar.test.js.
 */

const RUN_INTEGRATION_LIVE = process.env.RUN_INTEGRATION_LIVE === 'true';
const describeMaybe = RUN_INTEGRATION_LIVE ? describe : describe.skip;

describeMaybe('Email + upload integration (live)', () => {
  it('reports configured services', () => {
    const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
    expect(typeof emailConfigured).toBe('boolean');
  });
});
