import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfDay, 
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isPast,
  isFuture,
  differenceInDays,
  eachDayOfInterval,
  getDay,
  parseISO
} from 'date-fns';

/**
 * Centralized date utilities for calendar functionality
 */
export const dateUtils = {
  // Format dates for different contexts
  formatCalendarDate: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  },

  formatDisplayDate: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy');
  },

  formatTimeSlot: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'h:mm a');
  },

  formatMonthYear: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMMM yyyy');
  },

  formatWeekRange: (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    if (isSameMonth(start, end)) {
      return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  },

  // Calendar navigation helpers
  getMonthRange: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfMonth(dateObj),
      end: endOfMonth(dateObj)
    };
  },

  getWeekRange: (date, weekStartsOn = 0) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfWeek(dateObj, { weekStartsOn }),
      end: endOfWeek(dateObj, { weekStartsOn })
    };
  },

  getDayRange: (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
      start: startOfDay(dateObj),
      end: endOfDay(dateObj)
    };
  },

  // Navigation functions
  navigateMonth: (date, direction) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return direction === 'next' ? addMonths(dateObj, 1) : subMonths(dateObj, 1);
  },

  navigateWeek: (date, direction) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return direction === 'next' ? addWeeks(dateObj, 1) : subWeeks(dateObj, 1);
  },

  navigateDay: (date, direction) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return direction === 'next' ? addDays(dateObj, 1) : subDays(dateObj, 1);
  },

  // Task date operations
  isTaskDueToday: (task) => {
    if (!task?.due) return false;
    const dueDate = typeof task.due === 'string' ? parseISO(task.due) : task.due;
    return isToday(dueDate);
  },

  isTaskOverdue: (task) => {
    if (!task?.due || task.status === 'completed') return false;
    const dueDate = typeof task.due === 'string' ? parseISO(task.due) : task.due;
    return isPast(dueDate) && !isToday(dueDate);
  },

  getTasksForDate: (tasks, date) => {
    if (!tasks || !Array.isArray(tasks) || !date) return [];
    const targetDate = typeof date === 'string' ? parseISO(date) : date;
    
    return tasks.filter(task => {
      if (!task?.due) return false;
      const taskDate = typeof task.due === 'string' ? parseISO(task.due) : task.due;
      return isSameDay(taskDate, targetDate);
    });
  },

  getDaysUntilDue: (task) => {
    if (!task?.due) return null;
    const dueDate = typeof task.due === 'string' ? parseISO(task.due) : task.due;
    return differenceInDays(dueDate, new Date());
  },

  // Calendar grid helpers
  getCalendarGrid: (date, weekStartsOn = 0) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const monthStart = startOfMonth(dateObj);
    const monthEnd = endOfMonth(dateObj);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Group days into weeks (arrays of 7 days)
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  },

  getWeekDays: (startDate, weekStartsOn = 0) => {
    const dateObj = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const weekStart = startOfWeek(dateObj, { weekStartsOn });
    
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  },

  getTimeSlots: (startHour = 0, endHour = 24, intervalMinutes = 60) => {
    const slots = [];
    const baseDate = new Date();
    baseDate.setHours(startHour, 0, 0, 0);
    
    for (let hour = startHour; hour < endHour; hour += intervalMinutes / 60) {
      const slotDate = new Date(baseDate);
      slotDate.setHours(Math.floor(hour), (hour % 1) * 60);
      slots.push({
        time: format(slotDate, 'h:mm a'),
        hour: Math.floor(hour),
        minutes: (hour % 1) * 60,
        value: hour
      });
    }
    
    return slots;
  },

  // Utility functions
  isSameDate: (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(d1, d2);
  },

  isDateInCurrentMonth: (date, currentMonth) => {
    if (!date || !currentMonth) return false;
    const d = typeof date === 'string' ? parseISO(date) : date;
    const cm = typeof currentMonth === 'string' ? parseISO(currentMonth) : currentMonth;
    return isSameMonth(d, cm);
  },

  isWeekend: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const dayOfWeek = getDay(dateObj);
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  },

  getDateKey: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  },

  parseDate: (dateString) => {
    if (!dateString) return null;
    try {
      return parseISO(dateString);
    } catch (error) {
      //console.error('Error parsing date:', dateString, error);
      return null;
    }
  },

  getCurrentDate: () => new Date(),
  
  getTodayKey: () => format(new Date(), 'yyyy-MM-dd')
};

export default dateUtils;