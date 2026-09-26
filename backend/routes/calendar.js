import express from 'express';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const router = express.Router();

/**
 * GET /api/calendar/events
 * Get calendar events (tasks) for a date range
 */
router.get('/events', auth, async (req, res) => {
  try {
    const { startDate, endDate, view = 'month' } = req.query;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Start date is required', code: 'MISSING_START_DATE' }
      });
    }

    // Parse dates
    const start = parseISO(startDate);
    let end;

    if (endDate) {
      end = parseISO(endDate);
    } else {
      // Calculate end date based on view
      switch (view) {
        case 'week':
          end = endOfWeek(start);
          break;
        case 'day':
          end = endOfDay(start);
          break;
        case 'month':
        default:
          end = endOfMonth(start);
          break;
      }
    }

    // Fetch tasks within date range
    const tasks = await Task.find({
      user: req.user._id,
      due: {
        $gte: start,
        $lte: end
      }
    })
      .populate('assignee', 'fullname username avatar')
      .populate('project', 'name color')
      .sort({ due: 1 });

    res.json({
      success: true,
      data: {
        tasks,
        startDate: start,
        endDate: end,
        count: tasks.length
      },
      message: 'Calendar events fetched successfully'
    });
  } catch (error) {
    ////console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch calendar events', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * GET /api/calendar/tasks/:date
 * Get all tasks for a specific date
 */
router.get('/tasks/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = parseISO(date);

    const tasks = await Task.find({
      user: req.user._id,
      due: {
        $gte: startOfDay(targetDate),
        $lte: endOfDay(targetDate)
      }
    })
      .populate('assignee', 'fullname username avatar')
      .populate('project', 'name color')
      .sort({ due: 1, priority: -1 });

    res.json({
      success: true,
      data: {
        date: targetDate,
        tasks,
        count: tasks.length
      },
      message: 'Tasks fetched successfully'
    });
  } catch (error) {
    //console.error('Error fetching tasks for date:', error);
    res.status(400).json({
      success: false,
      error: { message: 'Invalid date format', code: 'INVALID_DATE' }
    });
  }
});

/**
 * POST /api/calendar/tasks
 * Create a task from calendar with date pre-filled
 */
router.post('/tasks', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('due').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, description, due, priority = 'medium', tags, project } = req.body;

    const task = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      due: parseISO(due),
      priority,
      tags: tags || [],
      project: project || null,
      user: req.user._id,
      status: 'in-progress'
    });

    await task.save();
    await task.populate('assignee', 'fullname username avatar');
    await task.populate('project', 'name color');

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    //console.error('Error creating task from calendar:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create task', code: 'CREATE_ERROR' }
    });
  }
});

/**
 * PUT /api/calendar/tasks/:id/date
 * Update task date (for drag-and-drop)
 */
router.put('/tasks/:id/date', auth, [
  body('due').isISO8601().withMessage('Valid due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { due } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user._id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found', code: 'TASK_NOT_FOUND' }
      });
    }

    task.due = parseISO(due);
    task.updatedAt = new Date();

    await task.save();
    await task.populate('assignee', 'fullname username avatar');
    await task.populate('project', 'name color');

    res.json({
      success: true,
      data: task,
      message: 'Task date updated successfully'
    });
  } catch (error) {
    //console.error('Error updating task date:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update task date', code: 'UPDATE_ERROR' }
    });
  }
});

/**
 * GET /api/calendar/recurring
 * Get recurring task instances for a date range
 */
router.get('/recurring', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Start and end dates are required', code: 'MISSING_DATES' }
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Find recurring tasks
    const recurringTasks = await Task.find({
      user: req.user._id,
      'recurring.enabled': true
    })
      .populate('assignee', 'fullname username avatar')
      .populate('project', 'name color');

    // Generate instances for each recurring task
    const instances = [];
    
    recurringTasks.forEach(task => {
      if (task.recurring && task.recurring.enabled) {
        // Generate instances based on recurring pattern
        // This is a simplified version - you'd implement full recurring logic here
        const taskInstances = generateRecurringInstances(task, start, end);
        instances.push(...taskInstances);
      }
    });

    res.json({
      success: true,
      data: {
        instances,
        count: instances.length
      },
      message: 'Recurring task instances fetched successfully'
    });
  } catch (error) {
    //console.error('Error fetching recurring tasks:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch recurring tasks', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * GET /api/calendar/summary
 * Get calendar summary for a date range (task counts by date)
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Start and end dates are required', code: 'MISSING_DATES' }
      });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Aggregate tasks by date
    const summary = await Task.aggregate([
      {
        $match: {
          user: req.user._id,
          due: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$due' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          medium: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          low: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: summary,
      message: 'Calendar summary fetched successfully'
    });
  } catch (error) {
    //console.error('Error fetching calendar summary:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch calendar summary', code: 'FETCH_ERROR' }
    });
  }
});

/**
 * Helper function to generate recurring task instances
 * This is a simplified version - implement full logic based on recurring patterns
 */
function generateRecurringInstances(task, startDate, endDate) {
  const instances = [];
  // Implement recurring logic here based on task.recurring pattern
  // For now, return empty array
  return instances;
}

export default router;
