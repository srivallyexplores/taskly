import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { CalendarProvider, useCalendar } from '../CalendarContext';

// Mock utilities
vi.mock('../../utils/dateUtils', () => ({
  dateUtils: {
    getMonthRange: vi.fn(() => ({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    })),
    getWeekRange: vi.fn(() => ({
      start: new Date('2024-01-01'),
      end: new Date('2024-01-07')
    })),
    getDayRange: vi.fn(() => ({
      start: new Date('2024-01-01T00:00:00'),
      end: new Date('2024-01-01T23:59:59')
    })),
    navigateMonth: vi.fn((date, direction) => {
      const newDate = new Date(date);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    }),
    navigateWeek: vi.fn((date, direction) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    }),
    navigateDay: vi.fn((date, direction) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    }),
    getTasksForDate: vi.fn(() => []),
  },
}));

vi.mock('../../utils/taskCalendarUtils', () => ({
  taskCalendarUtils: {
    groupTasksByDate: vi.fn(() => ({})),
    getTasksInDateRange: vi.fn(() => []),
  },
}));

describe('CalendarContext', () => {
  const wrapper = ({ children }) => (
    <CalendarProvider>{children}</CalendarProvider>
  );

  it('provides initial state', () => {
    const { result } = renderHook(() => useCalendar(), { wrapper });

    expect(result.current.currentView).toBe('month');
    expect(result.current.currentDate).toBeInstanceOf(Date);
    expect(result.current.selectedDate).toBeInstanceOf(Date);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.allTasks).toEqual([]);
    expect(result.current.tasksByDate).toEqual({});
  });

  it('throws error when used outside provider', () => {
    const { result } = renderHook(() => useCalendar());
    
    expect(result.error).toEqual(
      Error('useCalendar must be used within a CalendarProvider')
    );
  });

  describe('view management', () => {
    it('changes view', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setView('week');
      });

      expect(result.current.currentView).toBe('week');
    });

    it('updates date range when view changes', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setView('day');
      });

      expect(result.current.dateRange).toBeDefined();
      expect(result.current.dateRange.start).toBeInstanceOf(Date);
      expect(result.current.dateRange.end).toBeInstanceOf(Date);
    });
  });

  describe('date management', () => {
    it('sets current date', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const newDate = new Date('2024-02-15');

      act(() => {
        result.current.setCurrentDate(newDate);
      });

      expect(result.current.currentDate).toEqual(newDate);
    });

    it('sets selected date', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const newDate = new Date('2024-02-15');

      act(() => {
        result.current.setSelectedDate(newDate);
      });

      expect(result.current.selectedDate).toEqual(newDate);
    });

    it('navigates dates', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const originalDate = result.current.currentDate;

      act(() => {
        result.current.navigateDate('next');
      });

      expect(result.current.currentDate).not.toEqual(originalDate);
    });

    it('goes to today', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.goToToday();
      });

      // Should set current date to today
      const today = new Date();
      expect(result.current.currentDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('task management', () => {
    const mockTasks = [
      { _id: '1', title: 'Task 1', due: '2024-01-15' },
      { _id: '2', title: 'Task 2', due: '2024-01-16' },
    ];

    it('sets tasks', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setTasks(mockTasks);
      });

      expect(result.current.allTasks).toEqual(mockTasks);
      expect(result.current.isLoading).toBe(false);
    });

    it('adds task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const newTask = { _id: '3', title: 'New Task', due: '2024-01-17' };

      act(() => {
        result.current.setTasks(mockTasks);
      });

      act(() => {
        result.current.addTask(newTask);
      });

      expect(result.current.allTasks).toHaveLength(3);
      expect(result.current.allTasks).toContain(newTask);
    });

    it('updates task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const updatedTask = { _id: '1', title: 'Updated Task', due: '2024-01-15' };

      act(() => {
        result.current.setTasks(mockTasks);
      });

      act(() => {
        result.current.updateTask(updatedTask);
      });

      const task = result.current.allTasks.find(t => t._id === '1');
      expect(task.title).toBe('Updated Task');
    });

    it('removes task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setTasks(mockTasks);
      });

      act(() => {
        result.current.removeTask('1');
      });

      expect(result.current.allTasks).toHaveLength(1);
      expect(result.current.allTasks.find(t => t._id === '1')).toBeUndefined();
    });
  });

  describe('loading state', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('drag and drop', () => {
    it('sets dragged task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const task = { _id: '1', title: 'Dragged Task' };

      act(() => {
        result.current.setDraggedTask(task);
      });

      expect(result.current.draggedTask).toEqual(task);
    });
  });

  describe('task selection', () => {
    it('sets selected tasks', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const taskIds = ['1', '2', '3'];

      act(() => {
        result.current.setSelectedTasks(taskIds);
      });

      expect(result.current.selectedTasks).toEqual(taskIds);
    });

    it('adds selected task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.addSelectedTask('1');
      });

      expect(result.current.selectedTasks).toContain('1');

      act(() => {
        result.current.addSelectedTask('2');
      });

      expect(result.current.selectedTasks).toEqual(['1', '2']);
    });

    it('removes selected task', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setSelectedTasks(['1', '2', '3']);
      });

      act(() => {
        result.current.removeSelectedTask('2');
      });

      expect(result.current.selectedTasks).toEqual(['1', '3']);
    });
  });

  describe('filters', () => {
    it('sets filters', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const filters = {
        priority: ['high'],
        status: ['completed'],
        tags: ['urgent']
      };

      act(() => {
        result.current.setFilters(filters);
      });

      expect(result.current.filters).toEqual(filters);
    });

    it('updates individual filter', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.updateFilter('priority', ['high', 'medium']);
      });

      expect(result.current.filters.priority).toEqual(['high', 'medium']);
    });

    it('clears filters', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setFilters({
          priority: ['high'],
          status: ['completed'],
          tags: ['urgent']
        });
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        priority: [],
        status: [],
        tags: []
      });
    });
  });

  describe('settings', () => {
    it('updates settings', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const newSettings = {
        weekStartsOn: 1,
        timeFormat: '24h'
      };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.settings.weekStartsOn).toBe(1);
      expect(result.current.settings.timeFormat).toBe('24h');
    });
  });

  describe('error handling', () => {
    it('sets error', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const error = 'Something went wrong';

      act(() => {
        result.current.setError(error);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
    });

    it('clears error', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      act(() => {
        result.current.setError('Error message');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('computed values', () => {
    it('gets tasks for date', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const date = new Date('2024-01-15');

      const tasks = result.current.getTasksForDate(date);
      expect(Array.isArray(tasks)).toBe(true);
    });

    it('gets filtered tasks', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });
      const mockTasks = [
        { _id: '1', priority: 'high', status: 'completed', tags: ['work'] },
        { _id: '2', priority: 'low', status: 'in-progress', tags: ['personal'] },
      ];

      act(() => {
        result.current.setTasks(mockTasks);
        result.current.updateFilter('priority', ['high']);
      });

      const filtered = result.current.getFilteredTasks();
      expect(filtered).toHaveLength(1);
      expect(filtered[0]._id).toBe('1');
    });

    it('gets tasks in current range', () => {
      const { result } = renderHook(() => useCalendar(), { wrapper });

      const tasks = result.current.getTasksInCurrentRange();
      expect(Array.isArray(tasks)).toBe(true);
    });
  });
});