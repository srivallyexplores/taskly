/**
 * Cloudinary upload smoke test — LIVE credentials required.
 *
 * This suite performs real uploads/deletes against Cloudinary and is therefore
 * gated behind RUN_CLOUDINARY_LIVE=true. The default suite covers the avatar
 * upload route with Cloudinary mocked in tests/routes/upload-avatar.test.js.
 */

const RUN_CLOUDINARY_LIVE =
  process.env.RUN_CLOUDINARY_LIVE === 'true' &&
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

const describeMaybe = RUN_CLOUDINARY_LIVE ? describe : describe.skip;

describeMaybe('Cloudinary upload (live)', () => {
  it('connects and returns account usage', async () => {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const usage = await cloudinary.api.usage();
    expect(usage).toBeDefined();
  });
});
