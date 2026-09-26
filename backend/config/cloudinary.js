import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

/**
 * Validate Cloudinary configuration
 * @returns {Object} Validation result with success flag and error message
 */
export const validateCloudinaryConfig = () => {
  const missingVars = [];
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    missingVars.push('CLOUDINARY_CLOUD_NAME');
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    missingVars.push('CLOUDINARY_API_KEY');
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    missingVars.push('CLOUDINARY_API_SECRET');
  }

  if (missingVars.length > 0) {
    return {
      success: false,
      error: `Missing required Cloudinary environment variables: ${missingVars.join(', ')}. Please set them in your .env file.`
    };
  }

  return { success: true };
};

/**
 * Test Cloudinary connection
 * @returns {Promise<Object>} Connection test result
 */
export const testCloudinaryConnection = async () => {
  try {
    // Test connection by fetching account details
    const result = await cloudinary.api.ping();
    return {
      success: true,
      message: 'Cloudinary connection successful',
      status: result.status
    };
  } catch (error) {
    return {
      success: false,
      error: `Cloudinary connection failed: ${error.message}`,
      details: error.error?.message || 'Invalid credentials or network error'
    };
  }
};

// Validate configuration before proceeding
const configValidation = validateCloudinaryConfig();
/*
if (!configValidation.success) {
  console.warn('  [Cloudinary] Configuration Warning:', configValidation.error);
  console.warn('   Image upload functionality will not be available until Cloudinary is configured.');
  console.warn('   The server will continue to run, but avatar uploads will fail.');
} else {
  console.log(' [Cloudinary] Configuring with:', {
    cloud_name: '✓ Set',
    api_key: '✓ Set',
    api_secret: '✓ Set'
  });
*/

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Test connection on startup (async, don't block)
  /*
  testCloudinaryConnection().then(result => {
    if (result.success) {
      console.log(' [Cloudinary] Connection test successful');
    } else {
      console.error(' [Cloudinary] Connection test failed:', result.error);
      console.error('   Details:', result.details);
      console.error('   Please verify your Cloudinary credentials are correct');
    }
  }).catch(error => {
    console.error(' [Cloudinary] Connection test error:', error.message);
  });
}
  */

// Configure Cloudinary storage for multer (only if configured).
//
// Known limitation: the storage backend (CloudinaryStorage vs memoryStorage) is
// selected once here at module load, based on the env available at import time.
// Because dotenv.config() runs at the top of this module and the app loads env
// before requiring routes, this reflects the real configuration in practice.
// The upload route additionally re-checks validateCloudinaryConfig() per request
// and returns 503 CLOUDINARY_NOT_CONFIGURED when unset, so an unconfigured
// deployment fails fast rather than silently writing to memory storage.
let storage;
if (configValidation.success) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'taskly/avatars', // Folder in Cloudinary
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
    },
  });
} else {
  // Fallback to memory storage if Cloudinary not configured
  storage = multer.memoryStorage();
}

// Create multer upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Note: mimetype is client-controlled; Cloudinary re-validates the actual
    // bytes and enforces allowed_formats on the storage side. We avoid logging
    // per-request file metadata to stdout.
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to upload image to Cloudinary
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'taskly/avatars',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      ...options
    });
    return result;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export { cloudinary, upload, deleteImage, uploadImage };
export default cloudinary;