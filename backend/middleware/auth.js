import jwt from 'jsonwebtoken';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';

/**
 * Authentication middleware supporting both Cognito JWT and local JWT validation.
 *
 * In production (AWS), tokens are issued by Cognito and validated using aws-jwt-verify
 * which checks signature, expiry, audience, and issuer against the Cognito User Pool.
 *
 * In local development, tokens are validated using the existing jsonwebtoken library
 * with the JWT_SECRET environment variable.
 *
 *  3.6, 3.7
 */

// ─── Cognito JWT Verifier (lazy-initialized) ─────────────────────────────────

let cognitoVerifier = null;

/**
 * Returns a cached Cognito JWT verifier instance.
 * Only initializes when Cognito environment variables are configured.
 */
function getCognitoVerifier() {
  if (cognitoVerifier) return cognitoVerifier;

  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

  if (!userPoolId || !clientId) {
    return null;
  }

  cognitoVerifier = CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: 'access',
    clientId,
  });

  return cognitoVerifier;
}

/**
 * Determines if the application should use Cognito authentication.
 * Returns true when COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are set.
 */
function isCognitoEnabled() {
  return !!(process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID);
}

// ─── Session-based authentication middleware (for Passport) ──────────────────

const auth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: {
      message: 'Not authenticated',
      code: 'UNAUTHORIZED',
    },
  });
};

// ─── Unified Token Authentication (Cognito + Local JWT) ──────────────────────

/**
 * Authenticates requests using Bearer tokens.
 * - In production: validates Cognito JWT tokens (signature, expiry, audience)
 * - In local dev: validates tokens using JWT_SECRET
 *
 * Extracts user claims (sub, email, custom:userId) from validated Cognito tokens
 * and looks up the corresponding user in the database.
 *
 *  3.6, 3.7
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const hasBearer = !!authHeader && authHeader.startsWith('Bearer ');

    if (!hasBearer) {
      // ── Passport session fallback ──
      // The frontend authenticates via session cookies (Passport) and never
      // sends a Bearer token. When Cognito is NOT enabled and a valid session
      // exists, honor it so session-based routes work with this middleware.
      // Session fallback is intentionally disabled when Cognito is enabled to
      // avoid weakening production security.
      if (
        !isCognitoEnabled() &&
        typeof req.isAuthenticated === 'function' &&
        req.isAuthenticated() &&
        req.user
      ) {
        return next();
      }

      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    if (isCognitoEnabled()) {
      // ── Cognito JWT validation ──
      await authenticateWithCognito(req, res, next, token);
    } else {
      // ── Local JWT validation (backward compatibility) ──
      await authenticateWithLocalJwt(req, res, next, token);
    }
  } catch (error) {
    console.error('[Auth] Middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }
};

/**
 * Validates a Cognito JWT token and resolves the user from the database.
 * Extracts claims: sub, email, custom:userId from the verified token payload.
 */
async function authenticateWithCognito(req, res, next, token) {
  try {
    const verifier = getCognitoVerifier();
    if (!verifier) {
      // This is a misconfiguration in production - do NOT silently fall back
      console.error('[Auth] CRITICAL: Cognito verifier failed to initialize. Check COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID env vars.');
      return res.status(500).json({
        success: false,
        error: {
          message: 'Authentication service misconfigured',
          code: 'AUTH_CONFIG_ERROR',
        },
      });
    }

    const payload = await verifier.verify(token);

    // Extract user identity from Cognito claims
    const cognitoSub = payload.sub;
    const email = payload.email || payload['custom:email'];
    const userId = payload['custom:userId'];

    // Look up user by cognitoSub, then by custom:userId, then by email
    let user = null;
    if (cognitoSub) {
      user = await User.findOne({ cognitoSub }).select('-password');
    }
    if (!user && userId) {
      user = await User.findById(userId).select('-password');
    }
    if (!user && email) {
      user = await User.findOne({ email }).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'UNAUTHORIZED',
        },
      });
    }

    req.user = user;
    req.cognitoClaims = payload;
    next();
  } catch (error) {
    // Cognito verification errors (expired, invalid signature, wrong audience)
    if (
      error.name === 'JwtExpiredError' ||
      error.name === 'JwtInvalidClaimError' ||
      error.name === 'JwtInvalidSignatureError' ||
      error.message?.includes('expired') ||
      error.message?.includes('invalid')
    ) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          code: 'UNAUTHORIZED',
        },
      });
    }

    console.error('[Auth] Cognito verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
      },
    });
  }
}

/**
 * Validates a local JWT token (for development/backward compatibility).
 */
async function authenticateWithLocalJwt(req, res, next, token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'UNAUTHORIZED',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
      },
    });
  }
}

// ─── JWT-based authentication (legacy API token support) ─────────────────────

const jwtAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// ─── Team authentication middleware ──────────────────────────────────────────

const teamAuth = async (req, res, next) => {
  try {
    const teamId = req.params.id || req.body.teamId;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isMember = team.isMember(req.user.id);

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this team.' });
    }

    req.team = team;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during team authentication' });
  }
};

// ─── Project authentication middleware ───────────────────────────────────────

const projectAuth = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const project = await Project.findById(projectId).populate('team');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isProjectMember = project.isMember(req.user.id);
    const isTeamMember = project.team && project.team.isMember(req.user.id);

    if (!isProjectMember && !isTeamMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project or its team.' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during project authentication' });
  }
};

// ─── Role-based authorization middleware ─────────────────────────────────────

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const teamId = req.params.id || req.body.teamId;
      const projectId = req.params.id || req.body.projectId;

      let userRole = null;

      if (teamId && req.team) {
        userRole = req.team.getUserRole(req.user.id);
      } else if (projectId && req.project) {
        userRole = req.project.getUserRole(req.user.id);
      }

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole || 'none'}`,
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error during role authorization' });
    }
  };
};

// ─── Permission-based authorization middleware ───────────────────────────────

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const teamId = req.params.id || req.body.teamId;
      const projectId = req.params.id || req.body.projectId;

      let hasPermission = false;

      if (teamId && req.team) {
        hasPermission = req.team.hasPermission(req.user.id, permission);
      } else if (projectId && req.project) {
        hasPermission = req.project.hasPermission(req.user.id, permission);
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: `Access denied. Required permission: ${permission}`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error during permission authorization' });
    }
  };
};

// ─── Admin middleware ────────────────────────────────────────────────────────

const adminAuth = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin authentication' });
  }
};

// ─── Optional authentication middleware ──────────────────────────────────────

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');

    if (isCognitoEnabled()) {
      try {
        const verifier = getCognitoVerifier();
        if (verifier) {
          const payload = await verifier.verify(token);
          const cognitoSub = payload.sub;
          const user = await User.findOne({ cognitoSub }).select('-password');
          if (user) {
            req.user = user;
            req.cognitoClaims = payload;
          }
        }
      } catch {
        // Silent fail for optional auth
      }
    } else {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      } catch {
        // Silent fail for optional auth
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// ─── Rate limiting middleware ────────────────────────────────────────────────

const rateLimitSensitive = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (requests.has(key)) {
      const userRequests = requests.get(key).filter((time) => time > windowStart);
      requests.set(key, userRequests);
    }

    const userRequests = requests.get(key) || [];

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000),
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);

    next();
  };
};

// ─── Ownership transfer validation ──────────────────────────────────────────

const validateOwnershipTransfer = async (req, res, next) => {
  try {
    const { newOwnerId } = req.body;
    const resourceId = req.params.id;
    const resourceType = req.route.path.includes('teams') ? 'team' : 'project';

    if (!newOwnerId) {
      return res.status(400).json({ error: 'New owner ID is required' });
    }

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({ error: 'New owner not found' });
    }

    let resource;
    if (resourceType === 'team') {
      resource = await Team.findById(resourceId);
    } else {
      resource = await Project.findById(resourceId);
    }

    if (!resource) {
      return res.status(404).json({ error: `${resourceType} not found` });
    }

    if (!resource.isMember(newOwnerId)) {
      return res.status(400).json({ error: 'New owner must be a member of the ' + resourceType });
    }

    if (resource.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the current owner can transfer ownership' });
    }

    req.newOwner = newOwner;
    req.resource = resource;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during ownership transfer validation' });
  }
};

export {
  auth,
  authenticateToken,
  jwtAuth,
  teamAuth,
  projectAuth,
  requireRole,
  requirePermission,
  adminAuth,
  optionalAuth,
  rateLimitSensitive,
  validateOwnershipTransfer,
  // Export for testing
  isCognitoEnabled,
  getCognitoVerifier,
};
