'use strict';

/**
 * Cognito Pre-Token Generation Lambda Trigger
 *
 * Invoked before Cognito issues tokens. Adds custom claims to the ID and access tokens
 * so downstream services (API Gateway authorizer, Lambda handlers) can extract the
 * Taskly userId and roles without an additional database lookup on every request.
 *
 * 
 * - 3.3: WHEN a user authenticates via Google OAuth, THE Cognito_User_Pool SHALL
 *         federate the identity and create or link the corresponding Taskly user record.
 * - 3.6: THE API_Gateway SHALL validate Cognito JWT tokens on all protected endpoints.
 *
 * Event structure (TokenGeneration_HostedAuth or TokenGeneration_Authentication):
 * {
 *   triggerSource: 'TokenGeneration_HostedAuth',
 *   userName: 'cognito-sub-uuid',
 *   request: {
 *     userAttributes: {
 *       sub: 'cognito-sub-uuid',
 *       email: 'user@example.com',
 *       name: 'John Doe',
 *       ...
 *     },
 *     groupConfiguration: { groupsToOverride: [], iamRolesToOverride: [], preferredRole: null }
 *   },
 *   response: {
 *     claimsOverrideDetails: null
 *   }
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
 * Minimal User schema for token generation lookups.
 * Reuses existing model if already compiled (warm Lambda).
 */
function getUserModel() {
  if (mongoose.models.User) {
    return mongoose.models.User;
  }

  const UserSchema = new mongoose.Schema({
    fullname: { type: String },
    username: { type: String },
    email: { type: String },
    cognitoSub: { type: String, index: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    level: { type: Number, default: 1 },
    teams: { type: Array, default: [] },
  }, { collection: 'users', strict: false });

  return mongoose.model('User', UserSchema);
}

/**
 * Determines user roles based on their Taskly profile.
 * Roles are derived from team memberships and admin status.
 *
 * @param {object} user - The Taskly user document
 * @returns {string[]} Array of role strings
 */
function determineRoles(user) {
  const roles = ['user']; // Every authenticated user has the base 'user' role

  if (user.teams && user.teams.length > 0) {
    roles.push('team_member');
  }

  // Admin role could be determined by a flag or specific team ownership
  // For now, we keep it simple with user/team_member
  return roles;
}

/**
 * Lambda handler for Cognito Pre-Token Generation trigger.
 *
 * Looks up the Taskly user record by cognitoSub and injects custom claims
 * into the token response. If no user record is found (e.g., post-confirmation
 * trigger hasn't fired yet), we add minimal claims with just the sub.
 *
 * @param {object} event - Cognito trigger event
 * @param {object} context - Lambda context
 * @returns {object} The modified event with claimsOverrideDetails
 */
async function handler(event, context) {
  // Prevent Lambda from waiting for empty event loop (keeps DB connection alive)
  context.callbackWaitsForEmptyEventLoop = false;

  const cognitoSub = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;

  console.log('PreTokenGeneration trigger invoked:', JSON.stringify({
    triggerSource: event.triggerSource,
    userName: event.userName,
    cognitoSub,
  }));

  let customClaims = {};

  try {
    await withRotationRetry(async () => {
      await connectToDatabase();
    }, process.env.DOCUMENTDB_SECRET_NAME || 'taskly/production/documentdb-credentials');

    const User = getUserModel();

    // Look up the Taskly user by cognitoSub or email
    const user = await User.findOne({
      $or: [{ cognitoSub }, { email }],
    }).lean();

    if (user) {
      const roles = determineRoles(user);

      customClaims = {
        'custom:userId': user._id.toString(),
        'custom:username': user.username || '',
        'custom:roles': JSON.stringify(roles),
        'custom:level': String(user.level || 1),
      };

      console.log(`Enriched token for user ${user._id} with roles: ${roles.join(', ')}`);
    } else {
      // User record not yet created (race condition with post-confirmation)
      // Add minimal claims; the API layer will handle lazy user creation
      customClaims = {
        'custom:userId': '',
        'custom:username': '',
        'custom:roles': JSON.stringify(['user']),
        'custom:level': '1',
      };

      console.log(`No Taskly user found for cognitoSub ${cognitoSub}, adding minimal claims`);
    }
  } catch (error) {
    // Log error but don't block token generation — user can still authenticate
    // The API layer will handle missing custom claims gracefully
    console.error('Error enriching token claims:', {
      error: error.message,
      cognitoSub,
    });

    customClaims = {
      'custom:userId': '',
      'custom:username': '',
      'custom:roles': JSON.stringify(['user']),
      'custom:level': '1',
    };
  }

  // Inject custom claims into the token via claimsOverrideDetails
  event.response = {
    claimsOverrideDetails: {
      claimsToAddOrOverride: customClaims,
      claimsToSuppress: [],
    },
  };

  return event;
}

module.exports = { handler };
