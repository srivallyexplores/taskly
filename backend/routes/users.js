import express from 'express';
const router = express.Router();

import { 
    getUserById, 
    getAllUsers, 
    updateUser, 
    deleteUser,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteCurrentUser,
    requestPasswordReset,
    resetPassword,
    discoverUsers
} from '../controllers/userController.js';

import { authenticateToken } from '../middleware/auth.js';
import { 
    validateUpdateUser, 
    validateUserId, 
    validateUserQuery,
    validateUpdateProfile,
    validateChangePassword,
    validateUploadAvatar,
    validateCreateTask,
    validateTaskQuery
} from '../middleware/validation.js';

import {
    createTask,
    getTasksByUser,
    getUserProductivityStats,
    getTaskStatusSummary
} from '../controllers/taskController.js';

/**
 * @route   POST /api/users/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @route   POST /api/users/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', resetPassword);

/**
 * @route   GET /api/users/public
 * @desc    Get public users list (for home page showcase)
 * @access  Public
 */
router.get('/public', 
    validateUserQuery, 
    getAllUsers
);

/**
 * @route   GET /api/users/discover
 * @desc    Discover users for team invitations with pagination and search
 * @access  Private
 */
router.get('/discover', 
    authenticateToken, 
    discoverUsers
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and search
 * @access  Private
 */
router.get('/', 
    authenticateToken, 
    validateUserQuery, 
    getAllUsers
);

// Profile management routes (for current user) - must come before parameterized routes

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', 
    authenticateToken, 
    validateUpdateProfile, 
    updateProfile
);

/**
 * @route   PUT /api/users/profile/password
 * @desc    Change current user's password
 * @access  Private
 */
router.put('/profile/password', 
    authenticateToken, 
    validateChangePassword, 
    changePassword
);

/**
 * @route   PUT /api/users/profile/avatar
 * @desc    Update current user's avatar
 * @access  Private
 */
router.put('/profile/avatar', 
    authenticateToken, 
    validateUploadAvatar, 
    uploadAvatar
);

/**
 * @route   DELETE /api/users/profile
 * @desc    Delete current user's account
 * @access  Private
 */
router.delete('/profile', 
    authenticateToken, 
    deleteCurrentUser
);

// Parameterized routes (must come after specific routes)

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID with tasks and statistics
 * @access  Private
 */
router.get('/:userId', 
    authenticateToken, 
    validateUserId, 
    getUserById
);

/**
 * @route   PUT /api/users/:userId
 * @desc    Update user profile
 * @access  Private (own profile or admin)
 */
router.put('/:userId', 
    authenticateToken, 
    validateUserId, 
    validateUpdateUser, 
    updateUser
);

/**
 * @route   DELETE /api/users/:userId
 * @desc    Delete user account
 * @access  Private (own account or admin)
 */
router.delete('/:userId', 
    authenticateToken, 
    validateUserId, 
    deleteUser
);

// Task management routes for specific users

/**
 * @route   GET /api/users/:userId/tasks
 * @desc    Get all tasks for a specific user with filtering and sorting
 * @access  Private
 */
router.get('/:userId/tasks',
    authenticateToken,
    validateUserId,
    validateTaskQuery,
    getTasksByUser
);

/**
 * @route   POST /api/users/:userId/tasks
 * @desc    Create a new task for a specific user
 * @access  Private
 */
router.post('/:userId/tasks',
    authenticateToken,
    validateUserId,
    validateCreateTask,
    createTask
);

/**
 * @route   GET /api/users/:userId/stats
 * @desc    Get productivity statistics for a specific user
 * @access  Private
 */
router.get('/:userId/stats',
    authenticateToken,
    validateUserId,
    getUserProductivityStats
);

/**
 * @route   GET /api/users/:userId/tasks/summary
 * @desc    Get task status summary for a specific user
 * @access  Private
 */
router.get('/:userId/tasks/summary',
    authenticateToken,
    validateUserId,
    getTaskStatusSummary
);

export default router;