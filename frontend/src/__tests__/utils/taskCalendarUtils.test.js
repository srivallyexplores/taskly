import { taskCalendarUtils } from '../../utils/taskCalendarUtils';
import { addDays, format } from 'date-fns';

describe('taskCalendarUtils', () => {
  const mockTask = {
    _id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    due: new Date('2024-01-15T10:30:00Z').toISOString(),
    priority: 'high',
    status: 'pending',
    tags: ['work', 'urgent']
  };

  describe('getTaskColor', () => {
    test('returns correct color for high priority', () => {
      const task = { ...mockTask, priority: 'high' };
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('bg-red-500');
    });

    test('returns correct color for medium priority', () => {
      const task = { ...mockTask, priority: 'medium' };
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('bg-yellow-500');
    });

    test('returns correct color for low priority', () => {
      const task = { ...mockTask, priority: 'low' };
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('bg-green-500');
    });

    test('returns default color for unknown priority', () => {
      const task = { ...mockTask, priority: 'unknown' };
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('bg-secondary-500');
    });

    test('handles task without priority', () => {
      const task = { ...mockTask };
      delete task.priority;
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('bg-secondary-500');
    });

    test('applies opacity for completed tasks', () => {
      const task = { ...mockTask, status: 'completed' };
      const result = taskCalendarUtils.getTaskColor(task);
      expect(result).toContain('opacity-60');
    });
  });

  describe('getTaskDisplayText', () => {
    test('returns full title when under limit', () => {
      const task = { ...mockTask, title: 'Short' };
      const result = taskCalendarUtils.getTaskDisplayText(task, 20);
      expect(result).toBe('Short');
    });

    test('truncates title when over limit', () => {
      const task = { ...mockTask, title: 'This is a very long task title' };
      const result = taskCalendarUtils.getTaskDisplayText(task, 10);
      expect(result).toBe('This is a...');
    });

    test('handles empty title', () => {
      const task = { ...mockTask, title: '' };
      const result = taskCalendarUtils.getTaskDisplayText(task, 20);
      expect(result).toBe('Untitled Task');
    });

    test('handles null title', () => {
      const task = { ...mockTask, title: null };
      const result = taskCalendarUtils.getTaskDisplayText(task, 20);
      expect(result).toBe('Untitled Task');
    });

    test('uses default limit when not specified', () => {
      const task = { ...mockTask, title: 'A'.repeat(100) };
      const result = taskCalendarUtils.getTaskDisplayText(task);
      expect(result.length).toBeLessThanOrEqual(30); // Default limit + '...'
    });
  });

  describe('getTaskTooltipText', () => {
    test('generates comprehensive tooltip', () => {
      const result = taskCalendarUtils.getTaskTooltipText(mockTask);
      
      expect(result).toContain(mockTask.title);
      expect(result).toContain(mockTask.description);
      expect(result).toContain('Priority: high');
      expect(result).toContain('Status: pending');
      expect(result).toContain('Due:');
    });

    test('handles task without description', () => {
      const task = { ...mockTask };
      delete task.description;
      const result = taskCalendarUtils.getTaskTooltipText(task);
      
      expect(result).toContain(mockTask.title);
      expect(result).not.toContain('Description:');
    });

    test('handles task without due date', () => {
      const task = { ...mockTask };
      delete task.due;
      const result = taskCalendarUtils.getTaskTooltipText(task);
      
      expect(result).toContain('No due date');
    });

    test('includes tags when present', () => {
      const result = taskCalendarUtils.getTaskTooltipText(mockTask);
      expect(result).toContain('Tags: work, urgent');
    });

    test('handles task without tags', () => {
      const task = { ...mockTask };
      delete task.tags;
      const result = taskCalendarUtils.getTaskTooltipText(task);
      
      expect(result).not.toContain('Tags:');
    });
  });

  describe('calculateTaskPosition', () => {
    const cellBounds = {
      x: 0,
      y: 0,
      width: 150,
      height: 120
    };

    test('positions single task correctly', () => {
      const tasks = [mockTask];
      const result = taskCalendarUtils.calculateTaskPosition(mockTask, tasks, cellBounds);
      
      expect(result.x).toBe(2); // Padding
      expect(result.y).toBe(20); // Header space
      expect(result.width).toBe(146); // Cell width - padding
      expect(result.height).toBe(18); // Task height
    });

    test('stacks multiple tasks vertically', () => {
      const task2 = { ...mockTask, _id: 'task-2', title: 'Task 2' };
      const tasks = [mockTask, task2];
      
      const result1 = taskCalendarUtils.calculateTaskPosition(mockTask, tasks, cellBounds);
      const result2 = taskCalendarUtils.calculateTaskPosition(task2, tasks, cellBounds);
      
      expect(result1.y).toBe(20);
      expect(result2.y).toBe(40); // 20 + task height + gap
    });

    test('handles overlapping tasks', () => {
      const overlappingTasks = Array.from({ length: 10 }, (_, i) => ({
        ...mockTask,
        _id: `task-${i}`,
        title: `Task ${i}`
      }));
      
      const result = taskCalendarUtils.calculateTaskPosition(
        overlappingTasks[5], 
        overlappingTasks, 
        cellBounds
      );
      
      // Should still position within cell bounds
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.y + result.height).toBeLessThanOrEqual(cellBounds.height);
    });

    test('adjusts width for overlapping tasks', () => {
      const task1 = { ...mockTask, _id: 'task-1' };
      const task2 = { ...mockTask, _id: 'task-2', due: mockTask.due }; // Same time
      const tasks = [task1, task2];
      
      const result = taskCalendarUtils.calculateTaskPosition(task1, tasks, cellBounds);
      
      // Width should be adjusted for overlap
      expect(result.width).toBeLessThan(146);
    });
  });

  describe('generateMonthDates', () => {
    test('generates 42 dates for month view', () => {
      const date = new Date('2024-01-15');
      const result = taskCalendarUtils.generateMonthDates(date);
      
      expect(result).toHaveLength(42); // 6 weeks
    });

    test('includes previous month dates', () => {
      const date = new Date('2024-01-01'); // January 1st, 2024 (Monday)
      const result = taskCalendarUtils.generateMonthDates(date);
      
      // Should include December dates at the beginning
      expect(result[0].getMonth()).toBe(11); // December
      expect(result[0].getFullYear()).toBe(2023);
    });

    test('includes next month dates', () => {
      const date = new Date('2024-01-31'); // January 31st, 2024
      const result = taskCalendarUtils.generateMonthDates(date);
      
      // Should include February dates at the end
      const lastDate = result[result.length - 1];
      expect(lastDate.getMonth()).toBe(1); // February
    });

    test('handles February in leap year', () => {
      const date = new Date('2024-02-15'); // February 2024 (leap year)
      const result = taskCalendarUtils.generateMonthDates(date);
      
      expect(result).toHaveLength(42);
      
      // Should include February 29th
      const feb29 = result.find(d => d.getMonth() === 1 && d.getDate() === 29);
      expect(feb29).toBeDefined();
    });
  });

  describe('getTasksForDate', () => {
    const tasks = [
      { ...mockTask, _id: 'task-1', due: '2024-01-15T10:00:00Z' },
      { ...mockTask, _id: 'task-2', due: '2024-01-15T14:00:00Z' },
      { ...mockTask, _id: 'task-3', due: '2024-01-16T10:00:00Z' },
      { ...mockTask, _id: 'task-4', due: null }
    ];

    test('returns tasks for specific date', () => {
      const date = new Date('2024-01-15');
      const result = taskCalendarUtils.getTasksForDate(tasks, date);
      
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('task-1');
      expect(result[1]._id).toBe('task-2');
    });

    test('returns empty array for date with no tasks', () => {
      const date = new Date('2024-01-20');
      const result = taskCalendarUtils.getTasksForDate(tasks, date);
      
      expect(result).toHaveLength(0);
    });

    test('ignores tasks without due dates', () => {
      const date = new Date('2024-01-15');
      const result = taskCalendarUtils.getTasksForDate(tasks, date);
      
      // Should not include task-4 which has no due date
      expect(result.every(task => task.due)).toBe(true);
    });

    test('handles string date input', () => {
      const date = '2024-01-15';
      const result = taskCalendarUtils.getTasksForDate(tasks, date);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('sortTasksByTime', () => {
    const tasks = [
      { ...mockTask, _id: 'task-1', due: '2024-01-15T14:00:00Z', title: 'Afternoon' },
      { ...mockTask, _id: 'task-2', due: '2024-01-15T08:00:00Z', title: 'Morning' },
      { ...mockTask, _id: 'task-3', due: '2024-01-15T12:00:00Z', title: 'Noon' },
      { ...mockTask, _id: 'task-4', due: null, title: 'No time' }
    ];

    test('sorts tasks by time ascending', () => {
      const result = taskCalendarUtils.sortTasksByTime(tasks);
      
      expect(result[0].title).toBe('Morning');
      expect(result[1].title).toBe('Noon');
      expect(result[2].title).toBe('Afternoon');
      expect(result[3].title).toBe('No time'); // Tasks without due date go last
    });

    test('handles empty array', () => {
      const result = taskCalendarUtils.sortTasksByTime([]);
      expect(result).toHaveLength(0);
    });

    test('handles tasks with same time', () => {
      const sameTasks = [
        { ...mockTask, _id: 'task-1', due: '2024-01-15T10:00:00Z', title: 'Task A' },
        { ...mockTask, _id: 'task-2', due: '2024-01-15T10:00:00Z', title: 'Task B' }
      ];
      
      const result = taskCalendarUtils.sortTasksByTime(sameTasks);
      expect(result).toHaveLength(2);
      // Order should be preserved for same times
    });
  });

  describe('getTaskPriorityWeight', () => {
    test('returns correct weight for high priority', () => {
      const result = taskCalendarUtils.getTaskPriorityWeight('high');
      expect(result).toBe(3);
    });

    test('returns correct weight for medium priority', () => {
      const result = taskCalendarUtils.getTaskPriorityWeight('medium');
      expect(result).toBe(2);
    });

    test('returns correct weight for low priority', () => {
      const result = taskCalendarUtils.getTaskPriorityWeight('low');
      expect(result).toBe(1);
    });

    test('returns default weight for unknown priority', () => {
      const result = taskCalendarUtils.getTaskPriorityWeight('unknown');
      expect(result).toBe(1);
    });

    test('handles null/undefined priority', () => {
      expect(taskCalendarUtils.getTaskPriorityWeight(null)).toBe(1);
      expect(taskCalendarUtils.getTaskPriorityWeight(undefined)).toBe(1);
    });
  });

  describe('isTaskVisible', () => {
    const filters = {
      priority: ['high', 'medium'],
      status: ['pending'],
      tags: ['work']
    };

    test('returns true for task matching all filters', () => {
      const task = {
        ...mockTask,
        priority: 'high',
        status: 'pending',
        tags: ['work', 'urgent']
      };
      
      const result = taskCalendarUtils.isTaskVisible(task, filters);
      expect(result).toBe(true);
    });

    test('returns false for task not matching priority filter', () => {
      const task = {
        ...mockTask,
        priority: 'low',
        status: 'pending',
        tags: ['work']
      };
      
      const result = taskCalendarUtils.isTaskVisible(task, filters);
      expect(result).toBe(false);
    });

    test('returns false for task not matching status filter', () => {
      const task = {
        ...mockTask,
        priority: 'high',
        status: 'completed',
        tags: ['work']
      };
      
      const result = taskCalendarUtils.isTaskVisible(task, filters);
      expect(result).toBe(false);
    });

    test('returns false for task not matching tag filter', () => {
      const task = {
        ...mockTask,
        priority: 'high',
        status: 'pending',
        tags: ['personal']
      };
      
      const result = taskCalendarUtils.isTaskVisible(task, filters);
      expect(result).toBe(false);
    });

    test('returns true when no filters applied', () => {
      const result = taskCalendarUtils.isTaskVisible(mockTask, {});
      expect(result).toBe(true);
    });

    test('handles task with missing properties', () => {
      const incompleteTask = { _id: 'task-1', title: 'Incomplete' };
      const result = taskCalendarUtils.isTaskVisible(incompleteTask, filters);
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles null task input', () => {
      expect(() => taskCalendarUtils.getTaskColor(null)).not.toThrow();
      expect(() => taskCalendarUtils.getTaskDisplayText(null)).not.toThrow();
      expect(() => taskCalendarUtils.getTaskTooltipText(null)).not.toThrow();
    });

    test('handles undefined task input', () => {
      expect(() => taskCalendarUtils.getTaskColor(undefined)).not.toThrow();
      expect(() => taskCalendarUtils.getTaskDisplayText(undefined)).not.toThrow();
      expect(() => taskCalendarUtils.getTaskTooltipText(undefined)).not.toThrow();
    });

    test('handles invalid date inputs', () => {
      const invalidDate = new Date('invalid');
      expect(() => taskCalendarUtils.generateMonthDates(invalidDate)).not.toThrow();
      expect(() => taskCalendarUtils.getTasksForDate([], invalidDate)).not.toThrow();
    });

    test('handles empty task arrays', () => {
      const date = new Date('2024-01-15');
      const result = taskCalendarUtils.getTasksForDate([], date);
      expect(result).toHaveLength(0);
    });

    test('handles malformed task objects', () => {
      const malformedTask = { not: 'a valid task' };
      expect(() => taskCalendarUtils.getTaskColor(malformedTask)).not.toThrow();
      expect(() => taskCalendarUtils.getTaskDisplayText(malformedTask)).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('handles large task arrays efficiently', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTask,
        _id: `task-${i}`,
        title: `Task ${i}`,
        due: addDays(new Date(), i % 30).toISOString()
      }));

      const startTime = performance.now();
      
      // Test multiple operations
      const date = new Date('2024-01-15');
      taskCalendarUtils.getTasksForDate(largeTasks, date);
      taskCalendarUtils.sortTasksByTime(largeTasks.slice(0, 100));
      
      largeTasks.slice(0, 100).forEach(task => {
        taskCalendarUtils.getTaskColor(task);
        taskCalendarUtils.getTaskDisplayText(task);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(100); // 100ms
    });

    test('calendar date generation is efficient', () => {
      const startTime = performance.now();
      
      // Generate dates for a full year
      for (let month = 0; month < 12; month++) {
        const date = new Date(2024, month, 1);
        taskCalendarUtils.generateMonthDates(date);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 50ms
    });
  });
});