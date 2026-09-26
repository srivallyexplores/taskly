import express from 'express';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/aws.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload, validateCloudinaryConfig } from '../config/cloudinary.js';
import User from '../models/User.js';
import crypto from 'crypto';

/**
 * File Upload Routes — S3 Pre-signed URL Generation
 *
 * Replaces Cloudinary upload logic with S3 pre-signed URL generation.
 * Clients receive a pre-signed URL and upload directly to S3, reducing
 * server bandwidth and enabling larger file uploads.
 *
 *  4.1, 4.2, 4.3, 4.4
 */

const router = express.Router();

// ─── Configuration ───────────────────────────────────────────────────────────

const UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET || 'taskly-uploads';
const PRESIGNED_URL_EXPIRY = 300; // 5 minutes

// Allowed file types for avatars
const AVATAR_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed file types for attachments (any file up to 25MB)
const ATTACHMENT_MAX_SIZE = 25 * 1024 * 1024; // 25MB

// File extension mapping
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Generates a unique file key for S3 storage.
 * @param {string} prefix - S3 key prefix (e.g., 'avatars/{userId}')
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @returns {string} S3 object key
 */
function generateFileKey(prefix, filename, contentType) {
  const ext = MIME_TO_EXT[contentType] || filename.split('.').pop() || 'bin';
  const uniqueId = crypto.randomUUID();
  return `${prefix}/${uniqueId}.${ext}`;
}

/**
 * Validates file type against allowed MIME types.
 * @param {string} contentType - MIME type to validate
 * @param {string[]} allowedTypes - Array of allowed MIME types
 * @returns {boolean}
 */
function isValidFileType(contentType, allowedTypes) {
  return allowedTypes.includes(contentType);
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/upload/avatar
 * @desc    Upload an avatar image directly via Cloudinary (multipart/form-data).
 *          This is the endpoint the frontend (userService.uploadAvatarFile)
 *          calls. Field name: 'avatar'.
 * @access  Private
 *
 * Response (success):
 *   { success: true, data: { avatar, publicId }, message }
 * Response (Cloudinary not configured):
 *   503 { success: false, error: { message, code: 'CLOUDINARY_NOT_CONFIGURED' } }
 */
router.post('/avatar', authenticateToken, (req, res) => {
  // Guard: if Cloudinary is not configured, fail fast BEFORE invoking multer.
  const cloudinaryStatus = validateCloudinaryConfig();
  if (!cloudinaryStatus.success) {
    return res.status(503).json({
      success: false,
      error: {
        message: cloudinaryStatus.error || 'Image upload service is not configured',
        code: 'CLOUDINARY_NOT_CONFIGURED',
      },
    });
  }

  // Invoke multer manually so we can translate its errors into our API shape.
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      // Multer-specific errors (size limit) or fileFilter rejections.
      const isTooLarge = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        success: false,
        error: {
          message: isTooLarge
            ? 'File is too large. Maximum avatar size is 5MB.'
            : err.message || 'Invalid file upload',
          code: isTooLarge ? 'FILE_TOO_LARGE' : 'INVALID_FILE',
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No avatar file provided. Use the "avatar" form field.',
          code: 'NO_FILE',
        },
      });
    }

    try {
      // multer-storage-cloudinary sets:
      //   req.file.path     = Cloudinary secure_url
      //   req.file.filename = Cloudinary public_id
      const avatarUrl = req.file.path;
      const publicId = req.file.filename;

      // Persist to the user (fetch fresh to avoid stale session document writes).
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
          },
        });
      }

      user.avatar = avatarUrl;
      user.avatarPublicId = publicId;
      await user.save();

      return res.json({
        success: true,
        data: {
          avatar: avatarUrl,
          publicId,
        },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      console.error('[Upload] Cloudinary avatar upload error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to save uploaded avatar',
          code: 'AVATAR_UPLOAD_ERROR',
        },
      });
    }
  });
});

/**
 * @route   POST /api/upload/avatar/presign
 * @desc    Generate a pre-signed URL for avatar upload to S3
 * @access  Private
 *
 * Request body:
 *   - contentType: MIME type of the file (required)
 *   - filename: Original filename (required)
 *   - fileSize: File size in bytes (required)
 *
 * Response:
 *   - uploadUrl: Pre-signed PUT URL for direct S3 upload
 *   - fileKey: S3 object key for the uploaded file
 *   - publicUrl: CloudFront URL where the file will be accessible
 *
 *  4.1, 4.2
 */
router.post('/avatar/presign', authenticateToken, async (req, res) => {
  try {
    const { contentType, filename, fileSize } = req.body;

    // Validate required fields
    if (!contentType || !filename || fileSize === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'contentType, filename, and fileSize are required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Validate file type
    if (!isValidFileType(contentType, AVATAR_ALLOWED_TYPES)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid file type. Allowed types: jpg, jpeg, png, gif, webp, svg',
          code: 'INVALID_FILE_TYPE',
        },
      });
    }

    // Validate file size
    if (fileSize > AVATAR_MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File size exceeds the 5MB limit for avatars',
          code: 'FILE_TOO_LARGE',
        },
      });
    }

    // Generate S3 key
    const userId = req.user._id.toString();
    const fileKey = generateFileKey(`avatars/${userId}/original`, filename, contentType);

    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: fileKey,
      ContentType: contentType,
      ContentLength: fileSize,
      Metadata: {
        'uploaded-by': userId,
        'original-filename': filename,
        'upload-type': 'avatar',
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    // Construct the public URL (via CloudFront or direct S3)
    const cdnDomain = process.env.CDN_DOMAIN || `${UPLOAD_BUCKET}.s3.amazonaws.com`;
    const publicUrl = `https://${cdnDomain}/${fileKey}`;

    console.log('[Upload] Avatar pre-signed URL generated:', {
      userId,
      fileKey,
      contentType,
      fileSize,
    });

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        publicUrl,
        expiresIn: PRESIGNED_URL_EXPIRY,
      },
      message: 'Pre-signed URL generated. Upload file directly to the URL using PUT.',
    });
  } catch (error) {
    console.error('[Upload] Avatar presign error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate upload URL',
        code: 'PRESIGN_ERROR',
      },
    });
  }
});

/**
 * @route   POST /api/upload/avatar/confirm
 * @desc    Confirm avatar upload and update user profile
 * @access  Private
 *
 * Called after the client successfully uploads to S3 using the pre-signed URL.
 * Updates the user's avatar field in the database.
 *
 * Request body:
 *   - fileKey: S3 object key returned from presign endpoint
 */
router.post('/avatar/confirm', authenticateToken, async (req, res) => {
  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'fileKey is required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    // Delete old avatar from S3 if it exists
    if (user.avatarS3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: UPLOAD_BUCKET,
            Key: user.avatarS3Key,
          })
        );
      } catch (err) {
        console.warn('[Upload] Could not delete old avatar:', err.message);
      }
    }

    // Update user avatar
    const cdnDomain = process.env.CDN_DOMAIN || `${UPLOAD_BUCKET}.s3.amazonaws.com`;
    const avatarUrl = `https://${cdnDomain}/${fileKey}`;

    user.avatar = avatarUrl;
    user.avatarS3Key = fileKey;
    await user.save();

    res.json({
      success: true,
      data: {
        avatar: avatarUrl,
        fileKey,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('[Upload] Avatar confirm error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to confirm avatar upload',
        code: 'CONFIRM_ERROR',
      },
    });
  }
});

/**
 * @route   POST /api/upload/attachment/presign
 * @desc    Generate a pre-signed URL for task attachment upload to S3
 * @access  Private
 *
 * Request body:
 *   - contentType: MIME type of the file (required)
 *   - filename: Original filename (required)
 *   - fileSize: File size in bytes (required)
 *   - taskId: Associated task ID (required)
 *
 *  4.3
 */
router.post('/attachment/presign', authenticateToken, async (req, res) => {
  try {
    const { contentType, filename, fileSize, taskId } = req.body;

    // Validate required fields
    if (!contentType || !filename || fileSize === undefined || !taskId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'contentType, filename, fileSize, and taskId are required',
          code: 'VALIDATION_ERROR',
        },
      });
    }

    // Validate file size (25MB max for attachments)
    if (fileSize > ATTACHMENT_MAX_SIZE) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File size exceeds the 25MB limit for attachments',
          code: 'FILE_TOO_LARGE',
        },
      });
    }

    // Generate S3 key
    const fileKey = generateFileKey(`attachments/${taskId}`, filename, contentType);

    // Generate pre-signed URL
    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: fileKey,
      ContentType: contentType,
      ContentLength: fileSize,
      Metadata: {
        'uploaded-by': req.user._id.toString(),
        'original-filename': filename,
        'upload-type': 'attachment',
        'task-id': taskId,
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY,
    });

    const cdnDomain = process.env.CDN_DOMAIN || `${UPLOAD_BUCKET}.s3.amazonaws.com`;
    const publicUrl = `https://${cdnDomain}/${fileKey}`;

    console.log('[Upload] Attachment pre-signed URL generated:', {
      userId: req.user._id.toString(),
      taskId,
      fileKey,
      contentType,
      fileSize,
    });

    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey,
        publicUrl,
        expiresIn: PRESIGNED_URL_EXPIRY,
      },
      message: 'Pre-signed URL generated. Upload file directly to the URL using PUT.',
    });
  } catch (error) {
    console.error('[Upload] Attachment presign error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate upload URL',
        code: 'PRESIGN_ERROR',
      },
    });
  }
});

/**
 * @route   DELETE /api/upload/avatar
 * @desc    Delete user avatar from S3
 * @access  Private
 */
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    // Delete avatar from S3 if it exists
    if (user.avatarS3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: UPLOAD_BUCKET,
            Key: user.avatarS3Key,
          })
        );
      } catch (error) {
        console.warn('[Upload] Could not delete avatar from S3:', error.message);
      }
    }

    // Reset user avatar
    user.avatar = null;
    user.avatarS3Key = null;
    user.avatarPublicId = null;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('[Upload] Avatar deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete avatar',
        code: 'DELETE_ERROR',
      },
    });
  }
});

export default router;
