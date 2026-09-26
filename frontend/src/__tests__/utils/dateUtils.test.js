import { 
  dateUtils 
} from '../../utils/dateUtils';
import { 
  format, 
  addDays, 
  addWeeks, 
  addMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO
} from 'date-fns';

describe('dateUtils', () => {
  const testDate = new Date('2024-01-15T10:30:00Z');
  const testDateString = '2024-01-15T10:30:00Z';

  describe('formatDisplayDate', () => {
    test('formats date for display', () => {
      const result = dateUtils.formatDisplayDate(testDate);
      expect(result).toBe('Monday, January 15, 2024');
    });

    test('handles string input', () => {
      const result = dateUtils.formatDisplayDate(testDateString);
      expect(result).toBe('Monday, January 15, 2024');
    });

    test('handles invalid date', () => {
      const result = dateUtils.formatDisplayDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    test('handles null input', () => {
      const result = dateUtils.formatDisplayDate(null);
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatMonthYear', () => {
    test('formats month and year', () => {
      const result = dateUtils.formatMonthYear(testDate);
      expect(result).toBe('January 2024');
    });

    test('handles different months', () => {
      const julyDate = new Date('2024-07-15');
      const result = dateUtils.formatMonthYear(julyDate);
      expect(result).toBe('July 2024');
    });
  });

  describe('formatWeekRange', () => {
    test('formats week range within same month', () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-21');
      const result = dateUtils.formatWeekRange(start, end);
      expect(result).toBe('Jan 15 - 21, 2024');
    });

    test('formats week range across months', () => {
      const start = new Date('2024-01-29');
      const end = new Date('2024-02-04');
      const result = dateUtils.formatWeekRange(start, end);
      expect(result).toBe('Jan 29 - Feb 4, 2024');
    });

    test('formats week range across years', () => {
      const start = new Date('2023-12-25');
      const end = new Date('2024-01-07');
      const result = dateUtils.formatWeekRange(start, end);
      expect(result).toBe('Dec 25, 2023 - Jan 7, 2024');
    });
  });

  describe('formatTimeSlot', () => {
    test('formats time from date', () => {
      const result = dateUtils.formatTimeSlot(testDate);
      expect(result).toBe('10:30 AM');
    });

    test('formats time from string', () => {
      const result = dateUtils.formatTimeSlot(testDateString);
      expect(result).toBe('10:30 AM');
    });

    test('handles PM times', () => {
      const pmDate = new Date('2024-01-15T15:45:00Z');
      const result = dateUtils.formatTimeSlot(pmDate);
      expect(result).toBe('3:45 PM');
    });

    test('handles midnight', () => {
      const midnightDate = new Date('2024-01-15T00:00:00Z');
      const result = dateUtils.formatTimeSlot(midnightDate);
      expect(result).toBe('12:00 AM');
    });

    test('handles noon', () => {
      const noonDate = new Date('2024-01-15T12:00:00Z');
      const result = dateUtils.formatTimeSlot(noonDate);
      expect(result).toBe('12:00 PM');
    });
  });

  describe('isTaskDueToday', () => {
    const today = new Date();
    
    test('returns true for task due today', () => {
      const task = { due: today.toISOString() };
      const result = dateUtils.isTaskDueToday(task);
      expect(result).toBe(true);
    });

    test('returns false for task due tomorrow', () => {
      const tomorrow = addDays(today, 1);
      const task = { due: tomorrow.toISOString() };
      const result = dateUtils.isTaskDueToday(task);
      expect(result).toBe(false);
    });

    test('returns false for task without due date', () => {
      const task = {};
      const result = dateUtils.isTaskDueToday(task);
      expect(result).toBe(false);
    });

    test('returns false for task with null due date', () => {
      const task = { due: null };
      const result = dateUtils.isTaskDueToday(task);
      expect(result).toBe(false);
    });
  });

  describe('isTaskOverdue', () => {
    const now = new Date();
    const yesterday = addDays(now, -1);
    const tomorrow = addDays(now, 1);

    test('returns true for overdue task', () => {
      const task = { 
        due: yesterday.toISOString(),
        status: 'pending'
      };
      const result = dateUtils.isTaskOverdue(task);
      expect(result).toBe(true);
    });

    test('returns false for future task', () => {
      const task = { 
        due: tomorrow.toISOString(),
        status: 'pending'
      };
      const result = dateUtils.isTaskOverdue(task);
      expect(result).toBe(false);
    });

    test('returns false for completed task even if past due', () => {
      const task = { 
        due: yesterday.toISOString(),
        status: 'completed'
      };
      const result = dateUtils.isTaskOverdue(task);
      expect(result).toBe(false);
    });

    test('returns false for task without due date', () => {
      const task = { status: 'pending' };
      const result = dateUtils.isTaskOverdue(task);
      expect(result).toBe(false);
    });
  });

  describe('isSameDate', () => {
    test('returns true for same dates', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T15:00:00Z');
      const result = dateUtils.isSameDate(date1, date2);
      expect(result).toBe(true);
    });

    test('returns false for different dates', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      const result = dateUtils.isSameDate(date1, date2);
      expect(result).toBe(false);
    });

    test('handles string inputs', () => {
      const date1 = '2024-01-15T10:00:00Z';
      const date2 = '2024-01-15T15:00:00Z';
      const result = dateUtils.isSameDate(date1, date2);
      expect(result).toBe(true);
    });
  });

  describe('getDateRange', () => {
    const baseDate = new Date('2024-01-15');

    test('returns month range for month view', () => {
      const result = dateUtils.getDateRange('month', baseDate);
      
      expect(result.start).toEqual(startOfWeek(startOfMonth(baseDate)));
      expect(result.end).toEqual(endOfWeek(endOfMonth(baseDate)));
    });

    test('returns week range for week view', () => {
      const result = dateUtils.getDateRange('week', baseDate);
      
      expect(result.start).toEqual(startOfWeek(baseDate));
      expect(result.end).toEqual(endOfWeek(baseDate));
    });

    test('returns day range for day view', () => {
      const result = dateUtils.getDateRange('day', baseDate);
      
      const expectedStart = new Date(baseDate);
      expectedStart.setHours(0, 0, 0, 0);
      const expectedEnd = new Date(baseDate);
      expectedEnd.setHours(23, 59, 59, 999);
      
      expect(result.start).toEqual(expectedStart);
      expect(result.end).toEqual(expectedEnd);
    });

    test('returns extended range for agenda view', () => {
      const result = dateUtils.getDateRange('agenda', baseDate);
      
      expect(result.start).toEqual(baseDate);
      expect(result.end.getTime()).toBeGreaterThan(baseDate.getTime());
    });

    test('handles invalid view type', () => {
      const result = dateUtils.getDateRange('invalid', baseDate);
      
      expect(result.start).toEqual(startOfMonth(baseDate));
      expect(result.end).toEqual(endOfMonth(baseDate));
    });
  });

  describe('generateCalendarDates', () => {
    test('generates correct number of dates for month view', () => {
      const baseDate = new Date('2024-01-15');
      const result = dateUtils.generateCalendarDates(baseDate, 'month');
      
      expect(result).toHaveLength(42); // 6 weeks * 7 days
    });

    test('includes dates from previous and next month', () => {
      const baseDate = new Date('2024-01-15'); // January 2024
      const result = dateUtils.generateCalendarDates(baseDate, 'month');
      
      // Should include some December dates at the beginning
      expect(result[0].getMonth()).toBe(11); // December (0-indexed)
      
      // Should include some February dates at the end
      expect(result[result.length - 1].getMonth()).toBe(1); // February
    });

    test('generates week dates for week view', () => {
      const baseDate = new Date('2024-01-15'); // Monday
      const result = dateUtils.generateCalendarDates(baseDate, 'week');
      
      expect(result).toHaveLength(7);
      expect(result[0]).toEqual(startOfWeek(baseDate));
      expect(result[6]).toEqual(endOfWeek(baseDate));
    });

    test('generates single date for day view', () => {
      const baseDate = new Date('2024-01-15');
      const result = dateUtils.generateCalendarDates(baseDate, 'day');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(baseDate);
    });
  });

  describe('getRelativeDateText', () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);

    test('returns "Today" for today', () => {
      const result = dateUtils.getRelativeDateText(today);
      expect(result).toBe('Today');
    });

    test('returns "Yesterday" for yesterday', () => {
      const result = dateUtils.getRelativeDateText(yesterday);
      expect(result).toBe('Yesterday');
    });

    test('returns "Tomorrow" for tomorrow', () => {
      const result = dateUtils.getRelativeDateText(tomorrow);
      expect(result).toBe('Tomorrow');
    });

    test('returns formatted date for other dates', () => {
      const result = dateUtils.getRelativeDateText(nextWeek);
      expect(result).toBe(format(nextWeek, 'MMM d, yyyy'));
    });

    test('handles string input', () => {
      const result = dateUtils.getRelativeDateText(today.toISOString());
      expect(result).toBe('Today');
    });
  });

  describe('calculateDuration', () => {
    test('calculates duration between dates', () => {
      const start = new Date('2024-01-15T10:00:00Z');
      const end = new Date('2024-01-15T12:30:00Z');
      
      const result = dateUtils.calculateDuration(start, end);
      expect(result).toBe(150); // 2.5 hours in minutes
    });

    test('handles string inputs', () => {
      const start = '2024-01-15T10:00:00Z';
      const end = '2024-01-15T11:00:00Z';
      
      const result = dateUtils.calculateDuration(start, end);
      expect(result).toBe(60); // 1 hour in minutes
    });

    test('returns 0 for same times', () => {
      const time = new Date('2024-01-15T10:00:00Z');
      
      const result = dateUtils.calculateDuration(time, time);
      expect(result).toBe(0);
    });

    test('handles end time before start time', () => {
      const start = new Date('2024-01-15T12:00:00Z');
      const end = new Date('2024-01-15T10:00:00Z');
      
      const result = dateUtils.calculateDuration(start, end);
      expect(result).toBe(-120); // -2 hours
    });
  });

  describe('isWeekend', () => {
    test('returns true for Saturday', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      const result = dateUtils.isWeekend(saturday);
      expect(result).toBe(true);
    });

    test('returns true for Sunday', () => {
      const sunday = new Date('2024-01-14'); // Sunday
      const result = dateUtils.isWeekend(sunday);
      expect(result).toBe(true);
    });

    test('returns false for weekdays', () => {
      const monday = new Date('2024-01-15'); // Monday
      const result = dateUtils.isWeekend(monday);
      expect(result).toBe(false);
    });

    test('handles string input', () => {
      const saturday = '2024-01-13';
      const result = dateUtils.isWeekend(saturday);
      expect(result).toBe(true);
    });
  });

  describe('getTimeUntilDue', () => {
    test('calculates time until due date', () => {
      const now = new Date();
      const future = addDays(now, 2);
      const task = { due: future.toISOString() };
      
      const result = dateUtils.getTimeUntilDue(task);
      expect(result).toContain('2 days');
    });

    test('returns overdue message for past dates', () => {
      const now = new Date();
      const past = addDays(now, -1);
      const task = { due: past.toISOString() };
      
      const result = dateUtils.getTimeUntilDue(task);
      expect(result).toContain('overdue');
    });

    test('handles task without due date', () => {
      const task = {};
      
      const result = dateUtils.getTimeUntilDue(task);
      expect(result).toBe('No due date');
    });
  });

  describe('Edge Cases', () => {
    test('handles leap year correctly', () => {
      const leapYear = new Date('2024-02-29');
      const result = dateUtils.formatDisplayDate(leapYear);
      expect(result).toBe('Thursday, February 29, 2024');
    });

    test('handles year boundaries', () => {
      const newYear = new Date('2024-01-01');
      const result = dateUtils.generateCalendarDates(newYear, 'month');
      
      // Should include December dates from previous year
      expect(result[0].getFullYear()).toBe(2023);
    });

    test('handles different timezones', () => {
      const utcDate = new Date('2024-01-15T00:00:00Z');
      const result = dateUtils.formatTimeSlot(utcDate);
      
      // Should format time correctly regardless of local timezone
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });

    test('handles invalid date strings gracefully', () => {
      const result = dateUtils.formatDisplayDate('not-a-date');
      expect(result).toBe('Invalid Date');
    });

    test('handles null and undefined inputs', () => {
      expect(dateUtils.formatDisplayDate(null)).toBe('Invalid Date');
      expect(dateUtils.formatDisplayDate(undefined)).toBe('Invalid Date');
      expect(dateUtils.isTaskDueToday(null)).toBe(false);
      expect(dateUtils.isTaskOverdue(undefined)).toBe(false);
    });
  });

  describe('Performance', () => {
    test('handles large date ranges efficiently', () => {
      const startTime = performance.now();
      
      // Generate a year's worth of calendar dates
      for (let month = 0; month < 12; month++) {
        const date = new Date(2024, month, 1);
        dateUtils.generateCalendarDates(date, 'month');
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(100); // 100ms
    });

    test('date formatting is efficient', () => {
      const dates = Array.from({ length: 1000 }, (_, i) => 
        addDays(new Date(), i)
      );
      
      const startTime = performance.now();
      
      dates.forEach(date => {
        dateUtils.formatDisplayDate(date);
        dateUtils.formatTimeSlot(date);
        dateUtils.getRelativeDateText(date);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should format 1000 dates quickly
      expect(duration).toBeLessThan(500); // 500ms
    });
  });
});