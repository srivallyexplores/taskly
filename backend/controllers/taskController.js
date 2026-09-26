import Task from '../models/Task.js';
import User from '../models/User.js';
import { calculateProductivityStats } from '../utils/productivityStats.js';
import { publishTaskCompleted } from '../services/eventService.js';

/**
 * Create a new task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTask = async (req, res) => {
    try {
        // Get userId from params (for /users/:userId/tasks) or from authenticated user (for /tasks)
        const userId = req.params.userId || req.user._id.toString();
        const { title, due, priority, description, tags, labels, assignee, projectId, teamId } = req.body;



        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only create tasks for themselves or admin can create for any
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to create tasks for this user',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Convert due date to proper format
        const dueDate = new Date(due);

        // Create a new task and associate it with the user
        const taskData = {
            title,
            due: dueDate,
            priority,
            description,
            tags,
            labels,
            user: userId
        };

        // Add optional fields if provided
        if (assignee) {
            taskData.assignee = assignee;
        }
        if (projectId) {
            taskData.project = projectId;
        }
        if (teamId) {
            taskData.team = teamId;
        }

        const newTask = new Task(taskData);

        await newTask.save();

        // Save the task to the user's list of tasks
        user.tasks.push(newTask._id);
        await user.save();

        // Populate references before sending response
        const populatedTask = await Task.findById(newTask._id)
            .populate('assignee', 'fullname username email avatar')
            .populate('project', 'name description')
            .populate('team', 'name')
            .populate('user', 'fullname username email avatar');



        res.status(201).json({
            success: true,
            data: populatedTask,
            message: 'Task created successfully'
        });

    } catch (error) {
        //console.error('❌ [createTask] Error creating task:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation error',
                    code: 'VALIDATION_ERROR',
                    details: error.errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to create task',
                code: 'TASK_CREATE_ERROR'
            }
        });
    }
};

/**
 * Get task by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId)
            .populate('user', 'fullname username email avatar')
            .populate('assignee', 'fullname username email avatar')
            .populate('project', 'name description')
            .populate('team', 'name');
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only view their own tasks or admin can view any
        if (req.user._id.toString() !== task.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to view this task',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Evaluate dynamic task status
        const now = new Date();
        const dueDate = task.due;
        let dynamicStatus = task.status;

        if (dynamicStatus === "in-progress") {
            dynamicStatus = dueDate < now ? "failed" : "in-progress";
        }

        const taskResponse = {
            ...task._doc,
            dynamicStatus
        };

        res.json({
            success: true,
            data: {
                task: taskResponse
            },
            message: 'Task retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching task:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve task',
                code: 'TASK_FETCH_ERROR'
            }
        });
    }
};

/**
 * Get all tasks for a specific user with filtering and sorting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTasksByUser = async (req, res) => {
    try {
        // If no userId in params, use the authenticated user's ID
        const userId = req.params.userId || req.user._id.toString();
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const perPage = parseInt(req.query.limit, 10) || 8;
        const status = req.query.status;
        const priority = req.query.priority;
        const sortBy = req.query.sortBy || 'due';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const search = req.query.search || '';

        // Check if user exists (only if userId was provided in params)
        if (req.params.userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: {
                        message: 'User not found',
                        code: 'USER_NOT_FOUND'
                    }
                });
            }
        }

        // For public profile viewing, only show completed tasks
        // Full task access is only available for own profile or admin
        const isOwnProfile = req.user._id.toString() === userId;
        const isAdmin = req.user.role === 'admin';
        const canViewAllTasks = isOwnProfile || isAdmin;

        // Build filter query - include tasks created by user OR assigned to user
        let filterQuery = {
            $or: [
                { user: userId },      // Tasks created by user
                { assignee: userId }   // Tasks assigned to user
            ]
        };

        // For public viewing, only show completed tasks
        if (!canViewAllTasks) {
            filterQuery.status = 'completed';
        } else if (status) {
            filterQuery.status = status;
        }

        if (priority) {
            filterQuery.priority = priority;
        }

        if (search) {
            filterQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Get total task count for pagination
        const totalTasks = await Task.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalTasks / perPage);

        // Build sort object
        const sortObject = {};
        sortObject[sortBy] = sortOrder;

        // Fetch paginated tasks
        const rawTasks = await Task.find(filterQuery)
            .populate('assignee', 'fullname username email avatar')
            .populate('user', 'fullname username email avatar')
            .populate('project', 'name description')
            .populate('team', 'name')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort(sortObject);

        // Evaluate dynamic task status for each task
        const tasks = rawTasks.map(task => {
            const now = new Date();
            const dueDate = task.due;
            let dynamicStatus = task.status;

            if (dynamicStatus === "in-progress") {
                dynamicStatus = dueDate < now ? "failed" : "in-progress";
            }

            return {
                ...task._doc,
                dynamicStatus
            };
        });

        console.log('📋 [Backend] Sending tasks response:', {
            userId,
            tasksCount: tasks.length,
            page,
            totalTasks,
            totalPages
        });

        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalTasks,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1,
                    perPage
                },
                filters: {
                    status,
                    priority,
                    search,
                    sortBy,
                    sortOrder: sortOrder === 1 ? 'asc' : 'desc'
                }
            },
            message: 'Tasks retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching user tasks:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve tasks',
                code: 'TASKS_FETCH_ERROR'
            }
        });
    }
};

/**
 * Update a task by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const updates = req.body;

        // Find the task first to check authorization
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                }
            });
        }

        // Check authorization
        const isOwner = req.user._id.toString() === task.user.toString();
        const isAssignee = task.assignee && req.user._id.toString() === task.assignee.toString();
        const isAdmin = req.user.role === 'admin';

        // Assignees can only update status, not other fields
        if (isAssignee && !isOwner && !isAdmin) {
            // Check if trying to update fields other than status
            const allowedFields = ['status'];
            const updateFields = Object.keys(updates);
            const hasUnauthorizedFields = updateFields.some(field => !allowedFields.includes(field));
            
            if (hasUnauthorizedFields) {
                return res.status(403).json({
                    success: false,
                    error: {
                        message: 'Assignees can only update task status',
                        code: 'UNAUTHORIZED'
                    }
                });
            }
        } else if (!isOwner && !isAdmin) {
            // Not owner, assignee, or admin - no permission
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to update this task',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Validate due date if being updated
        if (updates.due) {
            const dueDate = new Date(updates.due);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Due date cannot be in the past',
                        code: 'INVALID_DUE_DATE'
                    }
                });
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId, 
            updates, 
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: {
                task: updatedTask
            },
            message: 'Task updated successfully'
        });

    } catch (error) {
        //console.error('Error updating task:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation error',
                    code: 'VALIDATION_ERROR',
                    details: error.errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update task',
                code: 'TASK_UPDATE_ERROR'
            }
        });
    }
};

/**
 * Mark a task as completed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Find the task first to check authorization
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only complete their own tasks or admin can complete any
        if (req.user._id.toString() !== task.user.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to complete this task',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Use the model method to complete the task
        await task.completeTask();

        // Publish task.completed event for async achievement processing
        // This replaces synchronous achievement checking in the request path
        try {
            await publishTaskCompleted(task._id.toString(), task.user.toString(), {
                title: task.title,
                priority: task.priority,
                project: task.project?.toString(),
                team: task.team?.toString(),
            });
        } catch (eventError) {
            // Log but don't fail the request — event processing is best-effort
            console.warn('[completeTask] Failed to publish task.completed event:', eventError.message);
        }

        res.json({
            success: true,
            data: {
                task
            },
            message: 'Task marked as completed'
        });

    } catch (error) {
        //console.error('Error completing task:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to complete task',
                code: 'TASK_COMPLETE_ERROR'
            }
        });
    }
};

/**
 * Delete a task by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        // Find the task first to check authorization and get user info
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only delete their own tasks or admin can delete any
        if (req.user._id.toString() !== task.user.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to delete this task',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Remove task from user's task list
        await User.findByIdAndUpdate(task.user, { $pull: { tasks: task._id } });

        // Delete the task
        await Task.findByIdAndDelete(taskId);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        //console.error('Error deleting task:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to delete task',
                code: 'TASK_DELETE_ERROR'
            }
        });
    }
};

/**
 * Get productivity statistics for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserProductivityStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // For public profile viewing, return basic stats only
        // Full stats are only available for own profile or admin
        const isOwnProfile = req.user._id.toString() === userId;
        const isAdmin = req.user.role === 'admin';
        const canViewFullStats = isOwnProfile || isAdmin;

        // Calculate productivity stats
        const stats = await calculateProductivityStats(userId);

        // Return limited stats for public viewing
        let responseStats = stats;
        if (!canViewFullStats) {
            // Only return basic public stats
            responseStats = {
                completed: stats.completed || 0,
                ongoing: stats.ongoing || 0,
                completionRate: stats.completionRate || 0,
                totalTasks: (stats.completed || 0) + (stats.ongoing || 0) + (stats.failed || 0)
            };
        }

        res.json({
            success: true,
            data: {
                userId,
                stats: responseStats
            },
            message: 'Productivity statistics retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching productivity stats:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve productivity statistics',
                code: 'STATS_FETCH_ERROR'
            }
        });
    }
};

/**
 * Update task status in real-time (for dynamic status updates)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        // Find the task first to check authorization
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can update status if they are:
        // 1. The task owner (creator)
        // 2. The assignee
        // 3. An admin
        const isOwner = req.user._id.toString() === task.user.toString();
        const isAssignee = task.assignee && req.user._id.toString() === task.assignee.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAssignee && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to update this task status',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Update task status
        task.status = status;
        await task.save();

        // Get updated productivity stats for real-time updates
        const stats = await calculateProductivityStats(task.user);

        res.json({
            success: true,
            data: {
                task,
                stats
            },
            message: 'Task status updated successfully'
        });

    } catch (error) {
        //console.error('Error updating task status:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation error',
                    code: 'VALIDATION_ERROR',
                    details: error.errors
                }
            });
        }

        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to update task status',
                code: 'TASK_STATUS_UPDATE_ERROR'
            }
        });
    }
};

/**
 * Get task status summary for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTaskStatusSummary = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                }
            });
        }

        // Check authorization - users can only view their own summary or admin can view any
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Not authorized to view task summary for this user',
                    code: 'UNAUTHORIZED'
                }
            });
        }

        // Get task counts by status
        const [inProgress, failed, completed] = await Promise.all([
            Task.countDocuments({ user: userId, status: 'in-progress' }),
            Task.countDocuments({ user: userId, status: 'failed' }),
            Task.countDocuments({ user: userId, status: 'completed' })
        ]);

        // Get tasks that are dynamically failed (due date passed but status is in-progress)
        const now = new Date();
        const dynamicallyFailed = await Task.countDocuments({
            user: userId,
            status: 'in-progress',
            due: { $lt: now }
        });

        // Adjust counts for dynamic status
        const actualInProgress = inProgress - dynamicallyFailed;
        const actualFailed = failed + dynamicallyFailed;

        const total = actualInProgress + actualFailed + completed;

        const summary = {
            total,
            inProgress: actualInProgress,
            failed: actualFailed,
            completed,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
            failureRate: total > 0 ? ((actualFailed / total) * 100).toFixed(2) : 0
        };

        res.json({
            success: true,
            data: {
                userId,
                summary
            },
            message: 'Task status summary retrieved successfully'
        });

    } catch (error) {
        //console.error('Error fetching task status summary:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to retrieve task status summary',
                code: 'SUMMARY_FETCH_ERROR'
            }
        });
    }
};

export {
    createTask,
    getTaskById,
    getTasksByUser,
    updateTask,
    completeTask,
    deleteTask,
    getUserProductivityStats,
    updateTaskStatus,
    getTaskStatusSummary
};