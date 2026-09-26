import { 
  addDays, 
  addWeeks, 
  addMonths, 
  addYears, 
  format, 
  isAfter, 
  isBefore, 
  isSameDay,
  startOfDay,
  endOfDay,
  getDay,
  getDaysInMonth,
  setDate
} from 'date-fns';

/**
 * Recurring task utilities for generating and managing recurring task instances
 */

// Recurring pattern types
export const RECURRING_TYPES = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

// End types for recurring patterns
export const END_TYPES = {
  NEVER: 'never',
  AFTER: 'after',
  ON: 'on'
};

// Days of week (Sunday = 0)
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

/**
 * Create a default recurring pattern
 * @returns {Object} Default recurring pattern
 */
export const createDefaultRecurringPattern = () => ({
  type: RECURRING_TYPES.NONE,
  interval: 1,
  daysOfWeek: [],
  dayOfMonth: null,
  monthOfYear: null,
  endType: END_TYPES.NEVER,
  endAfter: 10,
  endOn: null,
  exceptions: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
});

/**
 * Check if a task is a recurring task
 * @param {Object} task - Task to check
 * @returns {boolean} True if task is recurring
 */
export const isRecurringTask = (task) => {
  return task && task.recurring && task.recurring.type !== RECURRING_TYPES.NONE;
};

/**
 * Check if a task is a recurring instance
 * @param {Object} task - Task to check
 * @returns {boolean} True if task is a recurring instance
 */
export const isRecurringInstance = (task) => {
  return task && (task.isRecurring || task.recurringId);
};

/**
 * Get recurring task summary text
 * @param {Object} pattern - Recurring pattern
 * @returns {string} Human-readable summary
 */
export const getRecurringSummary = (pattern) => {
  if (!pattern || pattern.type === RECURRING_TYPES.NONE) {
    return 'Does not repeat';
  }
  
  let summary = '';
  
  // Base frequency
  switch (pattern.type) {
    case RECURRING_TYPES.DAILY:
      summary = pattern.interval === 1 ? 'Daily' : `Every ${pattern.interval} days`;
      break;
    case RECURRING_TYPES.WEEKLY:
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = pattern.daysOfWeek
          .sort()
          .map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
          .join(', ');
        summary = pattern.interval === 1 
          ? `Weekly on ${dayNames}`
          : `Every ${pattern.interval} weeks on ${dayNames}`;
      } else {
        summary = pattern.interval === 1 ? 'Weekly' : `Every ${pattern.interval} weeks`;
      }
      break;
    case RECURRING_TYPES.MONTHLY:
      if (pattern.dayOfMonth) {
        summary = pattern.interval === 1
          ? `Monthly on day ${pattern.dayOfMonth}`
          : `Every ${pattern.interval} months on day ${pattern.dayOfMonth}`;
      } else {
        summary = pattern.interval === 1 ? 'Monthly' : `Every ${pattern.interval} months`;
      }
      break;
    case RECURRING_TYPES.YEARLY:
      summary = pattern.interval === 1 ? 'Yearly' : `Every ${pattern.interval} years`;
      break;
    default:
      summary = 'Custom';
  }
  
  // End condition
  if (pattern.endType === END_TYPES.AFTER) {
    summary += `, ${pattern.endAfter} times`;
  } else if (pattern.endType === END_TYPES.ON && pattern.endOn) {
    summary += `, until ${format(new Date(pattern.endOn), 'MMM d, yyyy')}`;
  }
  
  return summary;
};