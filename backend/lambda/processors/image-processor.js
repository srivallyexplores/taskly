import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

/**
 * Image Processor Lambda — Avatar Resizing
 *
 * Triggered by S3 PutObject events on the avatars prefix.
 * Resizes uploaded avatar images to 400x400 pixels and stores
 * the processed version in the avatars/{userId}/processed/ prefix.
 *
 *  4.4
 *
 * Trigger: S3 Event Notification on prefix avatars/{userId}/original/
 * Timeout: 60s
 * Memory: 512 MB (sharp requires memory for image processing)
 */

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const AVATAR_SIZE = 400; // Target dimensions: 400x400 pixels
const PROCESSED_PREFIX = 'processed';
const SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'gif', 'webp'];

/**
 * Lambda handler for S3 event-triggered image processing.
 *
 * @param {object} event - S3 event notification
 * @returns {object} Processing results
 */
export const handler = async (event) => {
  const results = [];

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log('[ImageProcessor] Processing:', { bucket, key });

    // Only process files in the avatars/*/original/ path
    if (!key.includes('/original/')) {
      console.log('[ImageProcessor] Skipping non-original file:', key);
      results.push({ key, status: 'skipped', reason: 'not in original/ path' });
      continue;
    }

    // Skip SVG files (vector, no resizing needed)
    if (key.endsWith('.svg')) {
      console.log('[ImageProcessor] Skipping SVG file:', key);
      results.push({ key, status: 'skipped', reason: 'SVG format' });
      continue;
    }

    try {
      // Download the original image from S3
      const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3Client.send(getCommand);
      const imageBuffer = await streamToBuffer(response.Body);

      // Determine output format
      const extension = key.split('.').pop().toLowerCase();
      const outputFormat = extension === 'jpg' ? 'jpeg' : extension;

      if (!SUPPORTED_FORMATS.includes(outputFormat)) {
        console.log('[ImageProcessor] Unsupported format:', outputFormat);
        results.push({ key, status: 'skipped', reason: `unsupported format: ${outputFormat}` });
        continue;
      }

      // Resize to 400x400 with cover fit (crop to fill)
      const processedBuffer = await sharp(imageBuffer)
        .resize(AVATAR_SIZE, AVATAR_SIZE, {
          fit: 'cover',
          position: 'centre',
        })
        .toFormat(outputFormat, { quality: 85 })
        .toBuffer();

      // Generate processed key: avatars/{userId}/processed/{filename}
      const processedKey = key.replace('/original/', `/${PROCESSED_PREFIX}/`);

      // Upload processed image to S3
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: processedKey,
        Body: processedBuffer,
        ContentType: response.ContentType || `image/${outputFormat}`,
        Metadata: {
          'processed-from': key,
          'processed-at': new Date().toISOString(),
          'dimensions': `${AVATAR_SIZE}x${AVATAR_SIZE}`,
        },
      });

      await s3Client.send(putCommand);

      console.log('[ImageProcessor] Processed successfully:', {
        original: key,
        processed: processedKey,
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length,
        dimensions: `${AVATAR_SIZE}x${AVATAR_SIZE}`,
      });

      results.push({
        key,
        processedKey,
        status: 'success',
        originalSize: imageBuffer.length,
        processedSize: processedBuffer.length,
      });
    } catch (error) {
      console.error('[ImageProcessor] Error processing:', { key, error: error.message });
      results.push({ key, status: 'error', error: error.message });
    }
  }

  return {
    statusCode: 200,
    body: {
      processed: results.filter((r) => r.status === 'success').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    },
  };
};

/**
 * Converts a readable stream to a Buffer.
 * @param {ReadableStream} stream
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
