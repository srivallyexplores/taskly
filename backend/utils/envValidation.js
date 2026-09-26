/**
 * Environment variable validation and configuration
 */

/**
 * Validate required environment variables
 * @returns {Object} - Validation result with errors array
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  
  // Required variables
  const required = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'CLIENT_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  // Optional but recommended
  const recommended = [
    'RESEND_API_KEY',
    'EMAIL_FROM'
  ];
  
  // Check required variables
  required.forEach(variable => {
    if (!process.env[variable]) {
      errors.push(`Missing required environment variable: ${variable}`);
    }
  });
  
  // Check recommended variables
  recommended.forEach(variable => {
    if (!process.env[variable]) {
      warnings.push(`Missing recommended environment variable: ${variable}`);
    }
  });
  
  // Validate specific values
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be development, production, or test`);
  }
  
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    errors.push(`Invalid PORT: ${process.env.PORT}. Must be a number`);
  }
  
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is too short. Recommended minimum length is 32 characters');
  }
  
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    warnings.push('SESSION_SECRET is too short. Recommended minimum length is 32 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get environment configuration object
 * @returns {Object} - Configuration object
 */
export const getConfig = () => {
  return {
    // Application
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    
    // Database
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly',
    mongodbTestUri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/taskly_test',
    
    // Security
    jwtSecret: process.env.JWT_SECRET,
    sessionSecret: process.env.SESSION_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 604800000,
    
    // URLs
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    productionClientUrl: process.env.PRODUCTION_CLIENT_URL,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
    // Cloudinary
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    
    // Email (Resend)
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM || 'Taskly <onboarding@resend.dev>'
    },
    
    // Team & Project Settings
    team: {
      maxMembers: parseInt(process.env.TEAM_MAX_MEMBERS) || 50,
      inviteCodeExpiryDays: parseInt(process.env.INVITE_CODE_EXPIRY_DAYS) || 30
    },
    
    project: {
      maxMembers: parseInt(process.env.PROJECT_MAX_MEMBERS) || 20
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    
    // File Upload
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info'
  };
};

/**
 * Log environment configuration (safe version without secrets)
 */
export const logConfiguration = () => {
  const config = getConfig();
  
  //console.log('=== Environment Configuration ===');
  //console.log(`Node Environment: ${config.nodeEnv}`);
  //console.log(`Port: ${config.port}`);
  //console.log(`Database: ${config.mongodbUri.replace(/:[^:]*@/, ':***@')}`);
  //console.log(`Client URL: ${config.clientUrl}`);
  //console.log(`CORS Origin: ${config.corsOrigin}`);
  //console.log(`Cloudinary: ${config.cloudinary.cloudName ? 'Configured' : 'Not configured'}`);
  //console.log(`Resend Email: ${config.resend.apiKey ? 'Configured' : 'Not configured'}`);
  //console.log(`Team Max Members: ${config.team.maxMembers}`);
  //console.log(`Project Max Members: ${config.project.maxMembers}`);
  //console.log(`Rate Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs}ms`);
  //console.log('==================================');
};

/**
 * Check if email service is configured
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
  return !!process.env.RESEND_API_KEY;
};

/**
 * Check if Cloudinary is configured
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

export default {
  validateEnvironment,
  getConfig,
  logConfiguration,
  isEmailConfigured,
  isCloudinaryConfigured
};
