import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskCalendarUtils } from '../taskCalendarUtils';

// Mock dateUtils
vi.mock('../dateUtils', () => ({
  dateUtils: {
    formatCalendarDate: vi.fn((date) => '2024-01-15'),
    parseDate: vi.fn((dateString) => new Date(dateString)),
    isSameDate: vi.fn(() => false),
    getDateKey: vi.fn((date) => '2024-01-15'),
    getTasksForDate: vi.fn(() => []),
  },
}));

describe('taskCalendarUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTaskPosition', () => {
    it('returns position for month view', () => {
      const task = { _id: '1', title: 'Test Task' };
      const result = taskCalendarUtils.getTaskPosition(task, 'month');
      
      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 20 });
    });

    it('returns position for week view', () => {
      const task = { _id: '1', title: 'Test Task' };
      const result = taskCalendarUtils.getTaskPosition(task, 'week');
      
      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 60 });
    });

    it('returns position for day view', () => {
      const task = { _id: '1', title: 'Test Task' };
      const result = taskCalendarUtils.getTaskPosition(task, 'day');
      
      expect(result).toEqual({ x: 0, y: 0, width: 200, height: 40 });
    });

    it('returns default position for unknown view', () => {
      const task = { _id: '1', title: 'Test Task' };
      const result = taskCalendarUtils.getTaskPosition(task, 'unknown');
      
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('handles null task', () => {
      const result = taskCalendarUtils.getTaskPosition(null, 'month');
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });
  });

  describe('getTaskColor', () => {
    it('returns color for high priority task', () => {
      const task = { priority: 'high', status: 'in-progress' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-red-500');
    });

    it('returns color for medium priority task', () => {
      const task = { priority: 'medium', status: 'in-progress' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-yellow-500');
    });

    it('returns color for low priority task', () => {
      const task = { priority: 'low', status: 'in-progress' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-green-500');
    });

    it('returns default color for unknown priority', () => {
      const task = { priority: 'unknown', status: 'in-progress' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-blue-500');
    });

    it('applies completed status modifier', () => {
      const task = { priority: 'high', status: 'completed' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-red-500 opacity-60');
    });

    it('applies failed status modifier', () => {
      const task = { priority: 'high', status: 'failed' };
      const result = taskCalendarUtils.getTaskColor(task);
      
      expect(result).toBe('bg-red-500 opacity-40 line-through');
    });

    it('handles null task', () => {
      const result = taskCalendarUtils.getTaskColor(null);
      expect(result).toBe('bg-gray-500');
    });
  });

  describe('getTaskIndicator', () => {
    it('returns task indicator object', () => {
      const task = { 
        _id: '1', 
        title: 'Test Task', 
        priority: 'high' 
      };
      
      const result = taskCalendarUtils.getTaskIndicator(task);
      
      expect(result).toEqual({
        className: 'w-3 h-3 bg-red-500 rounded-full',
        title: 'Test Task - high priority',
        'data-task-id': '1'
      });
    });

    it('handles different sizes', () => {
      const task = { _id: '1', title: 'Test Task', priority: 'high' };
      const result = taskCalendarUtils.getTaskIndicator(task, 'lg');
      
      expect(result.className).toContain('w-5 h-5');
    });

    it('handles null task', () => {
      const result = taskCalendarUtils.getTaskIndicator(null);
      expect(result).toBeNull();
    });
  });

  describe('updateTaskDate', () => {
    it('updates task date successfully', async () => {
      const task = { _id: '1', title: 'Test Task', due: '2024-01-15' };
      const newDate = new Date('2024-01-16');
      const mockTaskService = {
        updateTask: vi.fn().mockResolvedValue({ ...task, due: '2024-01-16' })
      };
      
      const result = await taskCalendarUtils.updateTaskDate(task, newDate, mockTaskService);
      
      expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', {
        ...task,
        due: '2024-01-16'
      });
      expect(result.due).toBe('2024-01-16');
    });

    it('throws error when parameters are missing', async () => {
      await expect(
        taskCalendarUtils.updateTaskDate(null, new Date(), {})
      ).rejects.toThrow('Missing required parameters for task date update');
    });

    it('handles service error', async () => {
      const task = { _id: '1', title: 'Test Task' };
      const mockTaskService = {
        updateTask: vi.fn().mockRejectedValue(new Error('Service error'))
      };
      
      await expect(
        taskCalendarUtils.updateTaskDate(task, new Date(), mockTaskService)
      ).rejects.toThrow('Service error');
    });
  });

  describe('createTaskFromCalendar', () => {
    it('creates task with default values', () => {
      const date = new Date('2024-01-15');
      const result = taskCalendarUtils.createTaskFromCalendar(date);
      
      expect(result).toEqual({
        title: 'New Task',
        description: '',
        due: '2024-01-15',
        priority: 'medium',
        status: 'in-progress',
        tags: []
      });
    });

    it('creates task with custom data', () => {
      const date = new Date('2024-01-15');
      const quickData = {
        title: 'Custom Task',
        priority: 'high',
        tags: ['urgent']
      };
      
      const result = taskCalendarUtils.createTaskFromCalendar(date, quickData);
      
      expect(result).toEqual({
        title: 'Custom Task',
        description: '',
        due: '2024-01-15',
        priority: 'high',
        status: 'in-progress',
        tags: ['urgent']
      });
    });

    it('throws error when date is missing', () => {
      expect(() => {
        taskCalendarUtils.createTaskFromCalendar(null);
      }).toThrow('Date is required for task creation');
    });
  });

  describe('getTaskConflicts', () => {
    it('finds conflicting tasks on same date', () => {
      const task = { _id: '1', due: '2024-01-15' };
      const tasks = [
        { _id: '2', due: '2024-01-15' },
        { _id: '3', due: '2024-01-16' }
      ];
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.parseDate.mockImplementation(date => new Date(date));
      dateUtils.isSameDate.mockImplementation((date1, date2) => 
        date1.toDateString() === date2.toDateString()
      );
      
      const result = taskCalendarUtils.getTaskConflicts(task, tasks);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('2');
    });

    it('excludes same task from conflicts', () => {
      const task = { _id: '1', due: '2024-01-15' };
      const tasks = [
        { _id: '1', due: '2024-01-15' },
        { _id: '2', due: '2024-01-15' }
      ];
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.parseDate.mockImplementation(date => new Date(date));
      dateUtils.isSameDate.mockReturnValue(true);
      
      const result = taskCalendarUtils.getTaskConflicts(task, tasks);
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('2');
    });

    it('handles empty tasks array', () => {
      const task = { _id: '1', due: '2024-01-15' };
      const result = taskCalendarUtils.getTaskConflicts(task, []);
      expect(result).toEqual([]);
    });
  });

  describe('validateTaskDrop', () => {
    it('validates successful drop', () => {
      const task = { _id: '1', due: '2024-01-15' };
      const targetDate = '2024-01-16';
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.parseDate.mockReturnValue(new Date(targetDate));
      
      const result = taskCalendarUtils.validateTaskDrop(task, targetDate);
      expect(result).toBe(true);
    });

    it('rejects invalid date', () => {
      const task = { _id: '1', due: '2024-01-15' };
      const targetDate = 'invalid-date';
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.parseDate.mockReturnValue(null);
      
      const result = taskCalendarUtils.validateTaskDrop(task, targetDate);
      expect(result).toBe(false);
    });

    it('rejects missing parameters', () => {
      const result = taskCalendarUtils.validateTaskDrop(null, '2024-01-15');
      expect(result).toBe(false);
    });
  });

  describe('handleTaskDrag', () => {
    it('handles successful drag', async () => {
      const task = { _id: '1', title: 'Test Task' };
      const targetDate = '2024-01-16';
      const mockTaskService = {
        updateTask: vi.fn().mockResolvedValue({ ...task, due: targetDate })
      };
      const mockOnSuccess = vi.fn();
      const mockOnError = vi.fn();
      
      const result = await taskCalendarUtils.handleTaskDrag(
        task, 
        targetDate, 
        mockTaskService, 
        mockOnSuccess, 
        mockOnError
      );
      
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
      expect(result.due).toBe(targetDate);
    });

    it('handles drag error', async () => {
      const task = { _id: '1', title: 'Test Task' };
      const mockTaskService = {
        updateTask: vi.fn().mockRejectedValue(new Error('Update failed'))
      };
      const mockOnSuccess = vi.fn();
      const mockOnError = vi.fn();
      
      const result = await taskCalendarUtils.handleTaskDrag(
        task, 
        '2024-01-16', 
        mockTaskService, 
        mockOnSuccess, 
        mockOnError
      );
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('groupTasksByDate', () => {
    it('groups tasks by date', () => {
      const tasks = [
        { _id: '1', due: '2024-01-15' },
        { _id: '2', due: '2024-01-16' },
        { _id: '3', due: '2024-01-15' }
      ];
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.getDateKey.mockImplementation(date => date);
      
      const result = taskCalendarUtils.groupTasksByDate(tasks);
      
      expect(result['2024-01-15']).toHaveLength(2);
      expect(result['2024-01-16']).toHaveLength(1);
    });

    it('handles tasks without due dates', () => {
      const tasks = [
        { _id: '1', due: '2024-01-15' },
        { _id: '2' }, // No due date
      ];
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.getDateKey.mockImplementation(date => date);
      
      const result = taskCalendarUtils.groupTasksByDate(tasks);
      
      expect(result['2024-01-15']).toHaveLength(1);
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('getTaskDisplayText', () => {
    it('returns full title when under limit', () => {
      const task = { title: 'Short Task' };
      const result = taskCalendarUtils.getTaskDisplayText(task, 20);
      expect(result).toBe('Short Task');
    });

    it('truncates long titles', () => {
      const task = { title: 'This is a very long task title that should be truncated' };
      const result = taskCalendarUtils.getTaskDisplayText(task, 20);
      expect(result).toBe('This is a very lon...');
    });

    it('handles missing title', () => {
      const task = {};
      const result = taskCalendarUtils.getTaskDisplayText(task);
      expect(result).toBe('Untitled Task');
    });
  });

  describe('getTaskTooltipText', () => {
    it('generates tooltip text', () => {
      const task = {
        title: 'Test Task',
        priority: 'high',
        status: 'in-progress',
        description: 'Task description',
        tags: ['urgent', 'work']
      };
      
      const result = taskCalendarUtils.getTaskTooltipText(task);
      
      expect(result).toContain('Test Task');
      expect(result).toContain('Priority: high');
      expect(result).toContain('Status: in-progress');
      expect(result).toContain('Description: Task description');
      expect(result).toContain('Tags: urgent, work');
    });

    it('handles minimal task data', () => {
      const task = { title: 'Simple Task' };
      const result = taskCalendarUtils.getTaskTooltipText(task);
      
      expect(result).toContain('Simple Task');
      expect(result).toContain('Priority: medium');
      expect(result).toContain('Status: in-progress');
    });

    it('handles null task', () => {
      const result = taskCalendarUtils.getTaskTooltipText(null);
      expect(result).toBe('');
    });
  });

  describe('getDateTaskStats', () => {
    it('calculates task statistics', () => {
      const tasks = [
        { status: 'completed', priority: 'high' },
        { status: 'in-progress', priority: 'medium' },
        { status: 'failed', priority: 'low' }
      ];
      
      const { dateUtils } = require('../dateUtils');
      dateUtils.getTasksForDate.mockReturnValue(tasks);
      dateUtils.isTaskOverdue.mockReturnValue(false);
      
      const result = taskCalendarUtils.getDateTaskStats(tasks, new Date());
      
      expect(result).toEqual({
        total: 3,
        completed: 1,
        inProgress: 1,
        failed: 1,
        overdue: 0,
        high: 1,
        medium: 1,
        low: 1
      });
    });

    it('handles empty task list', () => {
      const { dateUtils } = require('../dateUtils');
      dateUtils.getTasksForDate.mockReturnValue([]);
      
      const result = taskCalendarUtils.getDateTaskStats([], new Date());
      
      expect(result.total).toBe(0);
      expect(result.completed).toBe(0);
    });
  });
});