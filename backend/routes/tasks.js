import express from 'express';
const router = express.Router();

import {
    createTask,
    getTaskById,
    getTasksByUser,
    updateTask,
    completeTask,
    deleteTask,
    updateTaskStatus
} from '../controllers/taskController.js';

import { authenticateToken } from '../middleware/auth.js';
import {
    validateTaskId,
    validateUserId,
    validateCreateTask,
    validateUpdateTask,
    validateTaskQuery,
    validateTaskStatus
} from '../middleware/validation.js';

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for current authenticated user
 * @access  Private
 */
router.get('/',
    authenticateToken,
    validateTaskQuery,
    getTasksByUser
);

/**
 * @route   GET /api/projects/:projectId/tasks
 * @desc    Get filtered tasks for a project
 * @access  Private
 */
router.get('/project/:projectId', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status, priority, assignee } = req.query;
        
        // Build query
        const query = { project: projectId };
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (priority && priority !== 'all') {
            query.priority = priority;
        }
        
        if (assignee && assignee !== 'all') {
            query.assignee = assignee;
        }
        
        const Task = (await import('../models/Task.js')).default;
        const tasks = await Task.find(query)
            .populate('user', 'fullname username avatar')
            .populate('assignee', 'fullname username avatar')
            .sort({ due: 1 });
        
        res.json({
            success: true,
            data: tasks,
            message: 'Tasks fetched successfully'
        });
    } catch (error) {
        //console.error('Error fetching filtered tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tasks'
        });
    }
});

/**
 * @route   POST /api/tasks
 * @desc    Create a new task for current user
 * @access  Private
 */
router.post('/',
    authenticateToken,
    validateCreateTask,
    createTask
);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:taskId',
    authenticateToken,
    validateTaskId,
    getTaskById
);

/**
 * @route   PUT /api/tasks/:taskId
 * @desc    Update task by ID
 * @access  Private
 */
router.put('/:taskId',
    authenticateToken,
    validateTaskId,
    validateUpdateTask,
    updateTask
);

/**
 * @route   PATCH /api/tasks/:taskId/complete
 * @desc    Mark task as completed
 * @access  Private
 */
router.patch('/:taskId/complete',
    authenticateToken,
    validateTaskId,
    completeTask
);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Delete task by ID
 * @access  Private
 */
router.delete('/:taskId',
    authenticateToken,
    validateTaskId,
    deleteTask
);

/**
 * @route   PATCH /api/tasks/:taskId/status
 * @desc    Update task status for real-time updates
 * @access  Private
 */
router.patch('/:taskId/status',
    authenticateToken,
    validateTaskId,
    validateTaskStatus,
    updateTaskStatus
);

export default router;