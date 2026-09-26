'use strict';

/**
 * Cognito Post-Confirmation Lambda Trigger
 *
 * Invoked after a user confirms their email or federates via Google OAuth.
 * Creates a Taskly user record in DocumentDB with fields from the Cognito event.
 *
 * 
 * - 3.3: WHEN a user authenticates via Google OAuth, THE Cognito_User_Pool SHALL
 *         federate the identity and create or link the corresponding Taskly user record.
 * - 3.6: THE API_Gateway SHALL validate Cognito JWT tokens on all protected endpoints.
 *
 * Event structure (Cognito PostConfirmation_ConfirmSignUp or PostConfirmation_ConfirmForgotPassword):
 * {
 *   triggerSource: 'PostConfirmation_ConfirmSignUp',
 *   userName: 'cognito-sub-uuid',
 *   request: {
 *     userAttributes: {
 *       sub: 'cognito-sub-uuid',
 *       email: 'user@example.com',
 *       name: 'John Doe',
 *       picture: 'https://...',
 *       'cognito:user_status': 'CONFIRMED',
 *       identities: '[{"providerName":"Google",...}]' // present for federated users
 *     }
 *   },
 *   response: {}
 * }
 */

const mongoose = require('mongoose');
const { getDocumentDBUri, withRotationRetry } = require('../../utils/secrets');

// Reuse DB connection across warm Lambda invocations
let cachedConnection = null;

/**
 * Establishes or reuses a DocumentDB connection.
 * @returns {Promise<mongoose.Connection>}
 */
async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = await getDocumentDBUri();

  cachedConnection = await mongoose.connect(uri, {
    maxPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: false, // DocumentDB limitation
  });

  return cachedConnection;
}

/**
 * Determines the auth provider from Cognito event attributes.
 * @param {object} userAttributes - Cognito user attributes
 * @returns {string} 'google' or 'local'
 */
function getAuthProvider(userAttributes) {
  const identities = userAttributes.identities;
  if (identities) {
    try {
      const parsed = JSON.parse(identities);
      if (Array.isArray(parsed) && parsed.some(id => id.providerName === 'Google')) {
        return 'google';
      }
    } catch {
      // Not valid JSON, treat as local
    }
  }
  return 'local';
}

/**
 * Generates a username from the email or Cognito username.
 * Appends a random suffix if the username already exists.
 * @param {string} email - User's email
 * @param {string} cognitoUsername - Cognito username (sub for federated users)
 * @param {mongoose.Model} UserModel - The User model
 * @returns {Promise<string>} A unique username
 */
async function generateUniqueUsername(email, cognitoUsername, UserModel) {
  // Try email prefix first
  let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');
  if (!baseUsername) {
    baseUsername = `user_${cognitoUsername.substring(0, 8)}`;
  }

  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const existing = await UserModel.findOne({ username });
    if (!existing) {
      return username;
    }
    // Append random suffix
    const suffix = Math.random().toString(36).substring(2, 6);
    username = `${baseUsername}_${suffix}`;
    attempts++;
  }

  // Fallback: use cognito sub as username
  return `user_${cognitoUsername.substring(0, 12)}`;
}

/**
 * Lambda handler for Cognito Post-Confirmation trigger.
 * @param {object} event - Cognito trigger event
 * @param {object} context - Lambda context
 * @returns {object} The event (must be returned for Cognito to proceed)
 */
async function handler(event, context) {
  // Prevent Lambda from waiting for empty event loop (keeps DB connection alive)
  context.callbackWaitsForEmptyEventLoop = false;

  console.log('PostConfirmation trigger invoked:', JSON.stringify({
    triggerSource: event.triggerSource,
    userName: event.userName,
    userPoolId: event.userPoolId,
  }));

  // Only process signup confirmations (not forgot-password confirmations)
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    console.log(`Skipping trigger source: ${event.triggerSource}`);
    return event;
  }

  const userAttributes = event.request.userAttributes;
  const cognitoSub = userAttributes.sub;
  const email = userAttributes.email;
  const name = userAttributes.name || '';
  const picture = userAttributes.picture || '';
  const authProvider = getAuthProvider(userAttributes);

  try {
    await withRotationRetry(async () => {
      await connectToDatabase();
    }, process.env.DOCUMENTDB_SECRET_NAME || 'taskly/production/documentdb-credentials');

    // Use the User model — define inline to avoid ESM import issues in Lambda CJS context
    const UserSchema = new mongoose.Schema({
      fullname: { type: String, required: true, trim: true },
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, default: '' },
      avatar: { type: String, default: '' },
      cognitoSub: { type: String, unique: true, sparse: true, index: true },
      authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now },
      onboarding: {
        completed: { type: Boolean, default: false },
        currentStep: { type: Number, default: 0 },
        completedSteps: { type: [Number], default: [] },
        completedAt: { type: Date, default: null },
      },
      preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
      stats: { type: mongoose.Schema.Types.Mixed, default: {} },
      level: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      achievements: { type: Array, default: [] },
      teams: { type: Array, default: [] },
      tasks: { type: Array, default: [] },
    }, { collection: 'users', timestamps: false });

    // Reuse existing model if already compiled (warm Lambda)
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Check if user already exists (e.g., re-confirmation or linked account)
    const existingUser = await User.findOne({
      $or: [{ cognitoSub }, { email }],
    });

    if (existingUser) {
      // Link the Cognito sub if not already linked
      if (!existingUser.cognitoSub) {
        existingUser.cognitoSub = cognitoSub;
        existingUser.authProvider = authProvider;
        existingUser.updated_at = new Date();
        await existingUser.save();
        console.log(`Linked existing user ${existingUser._id} to Cognito sub ${cognitoSub}`);
      } else {
        console.log(`User already exists for Cognito sub ${cognitoSub}`);
      }
      return event;
    }

    // Generate a unique username
    const username = await generateUniqueUsername(email, cognitoSub, User);

    // Create new Taskly user record
    const newUser = await User.create({
      fullname: name || username,
      username,
      email,
      password: '', // Cognito manages authentication; no local password needed
      avatar: picture || 'https://res.cloudinary.com/dbdbod1wt/image/upload/v1751666550/placeholder-user_rbr3rs.png',
      cognitoSub,
      authProvider,
      created_at: new Date(),
      updated_at: new Date(),
    });

    console.log(`Created Taskly user record: ${newUser._id} for Cognito sub ${cognitoSub}`);
  } catch (error) {
    // Log the error but don't throw — Cognito will still confirm the user.
    // The user record can be created lazily on first API call if this fails.
    console.error('Error creating user record in DocumentDB:', {
      error: error.message,
      cognitoSub,
      email,
    });
  }

  // Must return the event for Cognito to proceed
  return event;
}

module.exports = { handler };
