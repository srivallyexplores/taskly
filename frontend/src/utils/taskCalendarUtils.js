import { dateUtils } from './dateUtils';

/**
 * Task-specific calendar utilities for positioning, display, and operations
 */
export const taskCalendarUtils = {
  // Task positioning and display
  getTaskPosition: (task, view, containerRef) => {
    if (!task || !view) return { x: 0, y: 0, width: 0, height: 0 };

    switch (view) {
      case 'month':
        return getMonthViewPosition(task, containerRef);
      case 'week':
        return getWeekViewPosition(task, containerRef);
      case 'day':
        return getDayViewPosition(task, containerRef);
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  },

  getTaskColor: (task) => {
    if (!task) return 'bg-gray-500';

    // Priority-based colors
    const priorityColors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };

    // Status-based modifications
    const statusModifiers = {
      completed: 'opacity-60',
      failed: 'opacity-40 line-through',
      'in-progress': ''
    };

    const baseColor = priorityColors[task.priority] || 'bg-blue-500';
    const statusClass = statusModifiers[task.status] || '';

    return `${baseColor} ${statusClass}`.trim();
  },

  getTaskIndicator: (task, size = 'sm') => {
    if (!task) return null;

    const sizeClasses = {
      xs: 'w-2 h-2',
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    const color = taskCalendarUtils.getTaskColor(task);
    const sizeClass = sizeClasses[size] || sizeClasses.sm;

    return {
      className: `${sizeClass} ${color} rounded-full`,
      title: `${task.title} - ${task.priority} priority`,
      'data-task-id': task._id || task.id
    };
  },

  // Task operations
  updateTaskDate: async (task, newDate, taskService) => {
    if (!task || !newDate || !taskService) {
      throw new Error('Missing required parameters for task date update');
    }

    try {
      const updatedTask = {
        ...task,
        due: dateUtils.formatCalendarDate(newDate)
      };

      return await taskService.updateTask(task._id || task.id, updatedTask);
    } catch (error) {
      //console.error('Failed to update task date:', error);
      throw error;
    }
  },

  createTaskFromCalendar: (date, quickData = {}) => {
    if (!date) {
      throw new Error('Date is required for task creation');
    }

    return {
      title: quickData.title || 'New Task',
      description: quickData.description || '',
      due: dateUtils.formatCalendarDate(date),
      priority: quickData.priority || 'medium',
      status: 'in-progress',
      tags: quickData.tags || [],
      ...quickData
    };
  },

  getTaskConflicts: (task, tasks, timeThreshold = 60) => {
    if (!task || !tasks || !Array.isArray(tasks)) return [];

    const taskDate = dateUtils.parseDate(task.due);
    if (!taskDate) return [];

    return tasks.filter(existingTask => {
      if (!existingTask || existingTask._id === task._id) return false;
      
      const existingDate = dateUtils.parseDate(existingTask.due);
      if (!existingDate) return false;

      // Check if tasks are on the same date
      if (!dateUtils.isSameDate(taskDate, existingDate)) return false;

      // For now, consider any tasks on the same date as potential conflicts
      // In the future, this could be enhanced with time-based conflict detection
      return true;
    });
  },

  // Drag and drop utilities
  validateTaskDrop: (task, targetDate, existingTasks = []) => {
    if (!task || !targetDate) return false;

    // Basic validation - ensure target date is valid
    const target = dateUtils.parseDate(targetDate);
    if (!target) return false;

    // Don't allow dropping on past dates (optional business rule)
    // if (dateUtils.isPast(target) && !dateUtils.isToday(target)) return false;

    // Check for conflicts (optional)
    const conflicts = taskCalendarUtils.getTaskConflicts(
      { ...task, due: targetDate }, 
      existingTasks
    );

    // For now, allow conflicts but could be enhanced to prevent them
    return true;
  },

  handleTaskDrag: async (task, targetDate, taskService, onSuccess, onError) => {
    if (!task || !targetDate || !taskService) {
      const error = new Error('Missing required parameters for task drag');
      if (onError) onError(error);
      return null;
    }

    try {
      const updatedTask = await taskCalendarUtils.updateTaskDate(task, targetDate, taskService);
      if (onSuccess) onSuccess(updatedTask);
      return updatedTask;
    } catch (error) {
      //console.error('Task drag failed:', error);
      if (onError) onError(error);
      return null;
    }
  },

  getDropZoneDate: (coordinates, calendarRef) => {
    if (!coordinates || !calendarRef?.current) return null;

    try {
      const calendarRect = calendarRef.current.getBoundingClientRect();
      const relativeX = coordinates.x - calendarRect.left;
      const relativeY = coordinates.y - calendarRect.top;

      // Find the date cell at the given coordinates
      const dateCell = document.elementFromPoint(coordinates.x, coordinates.y);
      if (!dateCell) return null;

      // Look for date data attribute
      const dateCellWithDate = dateCell.closest('[data-date]');
      if (dateCellWithDate) {
        const dateString = dateCellWithDate.getAttribute('data-date');
        return dateUtils.parseDate(dateString);
      }

      return null;
    } catch (error) {
      //console.error('Error getting drop zone date:', error);
      return null;
    }
  },

  // Task grouping and organization
  groupTasksByDate: (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return {};

    return tasks.reduce((groups, task) => {
      if (!task?.due) return groups;

      const dateKey = dateUtils.getDateKey(task.due);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
      return groups;
    }, {});
  },

  sortTasksByTime: (tasks) => {
    if (!tasks || !Array.isArray(tasks)) return [];

    return [...tasks].sort((a, b) => {
      const dateA = dateUtils.parseDate(a.due);
      const dateB = dateUtils.parseDate(b.due);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA.getTime() - dateB.getTime();
    });
  },

  getTasksInDateRange: (tasks, startDate, endDate) => {
    if (!tasks || !Array.isArray(tasks) || !startDate || !endDate) return [];

    const start = dateUtils.parseDate(startDate);
    const end = dateUtils.parseDate(endDate);
    
    if (!start || !end) return [];

    return tasks.filter(task => {
      if (!task?.due) return false;
      
      const taskDate = dateUtils.parseDate(task.due);
      if (!taskDate) return false;
      
      return taskDate >= start && taskDate <= end;
    });
  },

  // Calendar view helpers
  getTaskDisplayText: (task, maxLength = 20) => {
    if (!task?.title) return 'Untitled Task';
    
    if (task.title.length <= maxLength) return task.title;
    return task.title.substring(0, maxLength - 3) + '...';
  },

  getTaskTooltipText: (task) => {
    if (!task) return '';

    const parts = [
      task.title || 'Untitled Task',
      `Priority: ${task.priority || 'medium'}`,
      `Status: ${task.status || 'in-progress'}`
    ];

    if (task.description) {
      parts.push(`Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`);
    }

    if (task.tags && task.tags.length > 0) {
      parts.push(`Tags: ${task.tags.join(', ')}`);
    }

    return parts.join('\n');
  },

  // Task statistics for calendar views
  getDateTaskStats: (tasks, date) => {
    const dateTasks = dateUtils.getTasksForDate(tasks, date);
    
    return {
      total: dateTasks.length,
      completed: dateTasks.filter(t => t.status === 'completed').length,
      inProgress: dateTasks.filter(t => t.status === 'in-progress').length,
      failed: dateTasks.filter(t => t.status === 'failed').length,
      overdue: dateTasks.filter(t => dateUtils.isTaskOverdue(t)).length,
      high: dateTasks.filter(t => t.priority === 'high').length,
      medium: dateTasks.filter(t => t.priority === 'medium').length,
      low: dateTasks.filter(t => t.priority === 'low').length
    };
  }
};

// Helper functions for positioning (internal use)
function getMonthViewPosition(task, containerRef) {
  // Basic positioning for month view - will be enhanced when implementing the actual views
  return { x: 0, y: 0, width: 100, height: 20 };
}

function getWeekViewPosition(task, containerRef) {
  // Basic positioning for week view - will be enhanced when implementing the actual views
  return { x: 0, y: 0, width: 100, height: 60 };
}

function getDayViewPosition(task, containerRef) {
  // Basic positioning for day view - will be enhanced when implementing the actual views
  return { x: 0, y: 0, width: 200, height: 40 };
}

export default taskCalendarUtils;