import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from './config/passport.js';
import dotenv from 'dotenv';
import { validateEnvironment, logConfiguration } from './utils/envValidation.js';

// Load .env from project root
dotenv.config();

// Validate environment variables before starting
console.log('\n  Validating environment configuration...');
const envValidation = validateEnvironment();

if (!envValidation.isValid) {
  console.error('\n Environment validation failed:');
  envValidation.errors.forEach(error => console.error(`  - ${error}`));
  console.error('\nPlease set the required environment variables in your .env file and restart the server.\n');
  process.exit(1);
}

if (envValidation.warnings.length > 0) {
  console.warn('\n  Environment warnings:');
  envValidation.warnings.forEach(warning => console.warn(`  - ${warning}`));
}

console.log(' Environment validation passed\n');

// Log configuration (safe version)
logConfiguration();

// Import security middleware
import {
  helmetConfig,
  mongoSanitizeConfig,
  sanitizeInput,
  generalLimiter,
  authLimiter,
  userLimiter
} from './middleware/security.js';

const app = express();

// Security middleware
app.use(helmetConfig);
// Temporarily disable mongo sanitize due to compatibility issues
// app.use(mongoSanitizeConfig);
app.use(sanitizeInput);

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/users', userLimiter);

// CORS configuration - Production ready
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.CLIENT_URL,
      process.env.PRODUCTION_CLIENT_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      // Allow all localhost and 127.0.0.1 origins in development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow anyway but log warning
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`CORS allowing origin in development: ${origin}`);
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // This is crucial for session cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use('/img', express.static('public/img'));
app.use('/uploads', express.static('public/uploads'));

// Database connection — skip in Lambda (handler.js manages DB connection) and
// in test mode (the test harness manages its own in-memory MongoDB connection).
if (!process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
}

// Session configuration — skip MongoStore in Lambda (stateless JWT auth) and in
// test mode (use the default in-memory store so tests need no external Mongo).
if (process.env.NODE_ENV === 'test') {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'test-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'taskly.sid',
    cookie: { secure: false, httpOnly: true }
  }));
} else if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'taskly.sid',
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/taskly',
      touchAfter: 24 * 3600
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIES === 'true',
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 1000 * 60 * 60 * 24 * 7,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
  }));
} else {
  // In Lambda, use a simple in-memory session (JWT handles auth)
  app.use(session({
    secret: process.env.SESSION_SECRET || 'lambda-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true }
  }));
}

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import uploadRoutes from './routes/upload.js';
import teamRoutes from './routes/teams.js';
import projectRoutes from './routes/projects.js';
import calendarRoutes from './routes/calendar.js';
import searchRoutes from './routes/search.js';
import invitationRoutes from './routes/invitations.js';
import notificationRoutes from './routes/notifications.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Taskly API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.json(healthCheck);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: isDevelopment ? err.message : 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Conditional startup: Lambda export vs local server listen.
// In Lambda, AWS_LAMBDA_FUNCTION_NAME is set automatically by the runtime.
// We export the app for the serverless-express adapter to wrap.
// In local dev or test, we either listen on a port or just export for tests.
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
  // Running in AWS Lambda — export app for the handler adapter
  console.log('Running in Lambda environment, exporting app for handler');
} else if (process.env.NODE_ENV !== 'test') {
  // Local development — start the HTTP server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;