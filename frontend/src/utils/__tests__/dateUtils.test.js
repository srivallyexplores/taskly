import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dateUtils } from '../dateUtils';

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') return '2024-01-15';
    if (formatStr === 'MMM d, yyyy') return 'Jan 15, 2024';
    if (formatStr === 'h:mm a') return '2:30 PM';
    if (formatStr === 'MMMM yyyy') return 'January 2024';
    return '2024-01-15';
  }),
  startOfMonth: vi.fn((date) => new Date('2024-01-01')),
  endOfMonth: vi.fn((date) => new Date('2024-01-31')),
  startOfWeek: vi.fn((date) => new Date('2024-01-14')),
  endOfWeek: vi.fn((date) => new Date('2024-01-20')),
  startOfDay: vi.fn((date) => new Date('2024-01-15T00:00:00')),
  endOfDay: vi.fn((date) => new Date('2024-01-15T23:59:59')),
  addDays: vi.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  addWeeks: vi.fn((date, weeks) => new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)),
  addMonths: vi.fn((date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }),
  subDays: vi.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  subWeeks: vi.fn((date, weeks) => new Date(date.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)),
  subMonths: vi.fn((date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() - months);
    return newDate;
  }),
  isSameDay: vi.fn((date1, date2) => date1.getTime() === date2.getTime()),
  isSameMonth: vi.fn((date1, date2) => 
    date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear()
  ),
  isToday: vi.fn((date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }),
  isPast: vi.fn((date) => date < new Date()),
  isFuture: vi.fn((date) => date > new Date()),
  differenceInDays: vi.fn((date1, date2) => Math.floor((date1 - date2) / (24 * 60 * 60 * 1000))),
  eachDayOfInterval: vi.fn(({ start, end }) => {
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }),
  getDay: vi.fn((date) => date.getDay()),
  parseISO: vi.fn((dateString) => new Date(dateString)),
}));

describe('dateUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatCalendarDate', () => {
    it('formats date to calendar format', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.formatCalendarDate(date);
      expect(result).toBe('2024-01-15');
    });

    it('handles string input', () => {
      const result = dateUtils.formatCalendarDate('2024-01-15');
      expect(result).toBe('2024-01-15');
    });

    it('handles null input', () => {
      const result = dateUtils.formatCalendarDate(null);
      expect(result).toBe('');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats date for display', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.formatDisplayDate(date);
      expect(result).toBe('Jan 15, 2024');
    });

    it('handles empty input', () => {
      const result = dateUtils.formatDisplayDate('');
      expect(result).toBe('');
    });
  });

  describe('formatTimeSlot', () => {
    it('formats time slot', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = dateUtils.formatTimeSlot(date);
      expect(result).toBe('2:30 PM');
    });
  });

  describe('formatMonthYear', () => {
    it('formats month and year', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.formatMonthYear(date);
      expect(result).toBe('January 2024');
    });
  });

  describe('formatWeekRange', () => {
    it('formats week range in same month', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-21');
      const result = dateUtils.formatWeekRange(start, end);
      expect(result).toBe('Jan 15 - 21, 2024');
    });

    it('formats week range across months', () => {
      const start = new Date('2024-01-29');
      const end = new Date('2024-02-04');
      // Mock isSameMonth to return false for cross-month
      const { isSameMonth } = require('date-fns');
      isSameMonth.mockReturnValueOnce(false);
      
      const result = dateUtils.formatWeekRange(start, end);
      expect(result).toBe('Jan 29 - Feb 4, 2024');
    });
  });

  describe('getMonthRange', () => {
    it('returns month start and end', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.getMonthRange(date);
      
      expect(result).toEqual({
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });
    });
  });

  describe('getWeekRange', () => {
    it('returns week start and end', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.getWeekRange(date);
      
      expect(result).toEqual({
        start: new Date('2024-01-14'),
        end: new Date('2024-01-20')
      });
    });

    it('respects weekStartsOn parameter', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.getWeekRange(date, 1); // Monday start
      
      expect(result).toEqual({
        start: new Date('2024-01-14'),
        end: new Date('2024-01-20')
      });
    });
  });

  describe('getDayRange', () => {
    it('returns day start and end', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.getDayRange(date);
      
      expect(result).toEqual({
        start: new Date('2024-01-15T00:00:00'),
        end: new Date('2024-01-15T23:59:59')
      });
    });
  });

  describe('navigation functions', () => {
    it('navigates to next month', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.navigateMonth(date, 'next');
      expect(result.getMonth()).toBe(1); // February
    });

    it('navigates to previous month', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.navigateMonth(date, 'prev');
      expect(result.getMonth()).toBe(11); // December (previous year)
    });

    it('navigates weeks', () => {
      const date = new Date('2024-01-15');
      const nextWeek = dateUtils.navigateWeek(date, 'next');
      const prevWeek = dateUtils.navigateWeek(date, 'prev');
      
      expect(nextWeek.getTime()).toBeGreaterThan(date.getTime());
      expect(prevWeek.getTime()).toBeLessThan(date.getTime());
    });

    it('navigates days', () => {
      const date = new Date('2024-01-15');
      const nextDay = dateUtils.navigateDay(date, 'next');
      const prevDay = dateUtils.navigateDay(date, 'prev');
      
      expect(nextDay.getTime()).toBeGreaterThan(date.getTime());
      expect(prevDay.getTime()).toBeLessThan(date.getTime());
    });
  });

  describe('task operations', () => {
    const mockTask = {
      due: '2024-01-15',
      status: 'in-progress'
    };

    it('checks if task is due today', () => {
      const { isToday } = require('date-fns');
      isToday.mockReturnValue(true);
      
      const result = dateUtils.isTaskDueToday(mockTask);
      expect(result).toBe(true);
    });

    it('checks if task is overdue', () => {
      const { isPast, isToday } = require('date-fns');
      isPast.mockReturnValue(true);
      isToday.mockReturnValue(false);
      
      const result = dateUtils.isTaskOverdue(mockTask);
      expect(result).toBe(true);
    });

    it('does not mark completed tasks as overdue', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      const result = dateUtils.isTaskOverdue(completedTask);
      expect(result).toBe(false);
    });

    it('gets tasks for specific date', () => {
      const tasks = [
        { due: '2024-01-15' },
        { due: '2024-01-16' },
        { due: '2024-01-15' }
      ];
      
      const { isSameDay } = require('date-fns');
      isSameDay.mockImplementation((date1, date2) => 
        date1.toDateString() === date2.toDateString()
      );
      
      const result = dateUtils.getTasksForDate(tasks, new Date('2024-01-15'));
      expect(result).toHaveLength(2);
    });

    it('gets days until due', () => {
      const { differenceInDays } = require('date-fns');
      differenceInDays.mockReturnValue(5);
      
      const result = dateUtils.getDaysUntilDue(mockTask);
      expect(result).toBe(5);
    });
  });

  describe('calendar grid helpers', () => {
    it('generates calendar grid', () => {
      const date = new Date('2024-01-15');
      const { eachDayOfInterval } = require('date-fns');
      
      // Mock 42 days (6 weeks)
      const mockDays = Array.from({ length: 42 }, (_, i) => 
        new Date('2024-01-01T00:00:00Z').getTime() + i * 24 * 60 * 60 * 1000
      ).map(time => new Date(time));
      
      eachDayOfInterval.mockReturnValue(mockDays);
      
      const result = dateUtils.getCalendarGrid(date);
      expect(result).toHaveLength(6); // 6 weeks
      expect(result[0]).toHaveLength(7); // 7 days per week
    });

    it('generates week days', () => {
      const startDate = new Date('2024-01-15');
      const result = dateUtils.getWeekDays(startDate);
      
      expect(result).toHaveLength(7);
    });

    it('generates time slots', () => {
      const result = dateUtils.getTimeSlots(9, 17, 60); // 9 AM to 5 PM, hourly
      
      expect(result).toHaveLength(8); // 9, 10, 11, 12, 13, 14, 15, 16
      expect(result[0]).toEqual({
        time: '2:30 PM', // Mocked format result
        hour: 9,
        minutes: 0,
        value: 9
      });
    });
  });

  describe('utility functions', () => {
    it('checks if dates are same', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-15');
      
      const { isSameDay } = require('date-fns');
      isSameDay.mockReturnValue(true);
      
      const result = dateUtils.isSameDate(date1, date2);
      expect(result).toBe(true);
    });

    it('checks if date is in current month', () => {
      const date = new Date('2024-01-15');
      const currentMonth = new Date('2024-01-01');
      
      const { isSameMonth } = require('date-fns');
      isSameMonth.mockReturnValue(true);
      
      const result = dateUtils.isDateInCurrentMonth(date, currentMonth);
      expect(result).toBe(true);
    });

    it('checks if date is weekend', () => {
      const { getDay } = require('date-fns');
      getDay.mockReturnValue(0); // Sunday
      
      const result = dateUtils.isWeekend(new Date());
      expect(result).toBe(true);
    });

    it('gets date key', () => {
      const date = new Date('2024-01-15');
      const result = dateUtils.getDateKey(date);
      expect(result).toBe('2024-01-15');
    });

    it('parses date string', () => {
      const result = dateUtils.parseDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
    });

    it('handles invalid date string', () => {
      const { parseISO } = require('date-fns');
      parseISO.mockImplementation(() => {
        throw new Error('Invalid date');
      });
      
      const result = dateUtils.parseDate('invalid-date');
      expect(result).toBeNull();
    });

    it('gets current date', () => {
      const result = dateUtils.getCurrentDate();
      expect(result).toBeInstanceOf(Date);
    });

    it('gets today key', () => {
      const result = dateUtils.getTodayKey();
      expect(result).toBe('2024-01-15');
    });
  });
});