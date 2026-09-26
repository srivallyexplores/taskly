import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendar } from '../../../context/CalendarContext';
import { dateUtils } from '../../../utils/dateUtils';
import { taskCalendarUtils } from '../../../utils/taskCalendarUtils';
import CalendarGrid from '../CalendarGrid';

const MonthView = ({ 
  onDateClick, 
  onTaskClick, 
  onTaskDrop,
  onCreateTask 
}) => {
  const {
    currentDate,
    getTasksForDate,
    setSelectedDate,
    settings
  } = useCalendar();

  const [hoveredDate, setHoveredDate] = useState(null);
  const [showTaskOverflow, setShowTaskOverflow] = useState(null);

  // Handle date cell click
  const handleDateClick = useCallback((date, event) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date, event);
    }
  }, [setSelectedDate, onDateClick]);

  // Handle task click
  const handleTaskClick = useCallback((task, event) => {
    if (onTaskClick) {
      onTaskClick(task, event);
    }
  }, [onTaskClick]);

  // Handle task drop
  const handleTaskDrop = useCallback((taskId, targetDate, originalDate) => {
    if (onTaskDrop) {
      onTaskDrop(taskId, targetDate, originalDate);
    }
  }, [onTaskDrop]);

  // Handle date hover for task preview
  const handleDateHover = useCallback((date) => {
    setHoveredDate(date);
  }, []);

  // Handle task overflow click
  const handleTaskOverflowClick = useCallback((date, event) => {
    event.stopPropagation();
    setShowTaskOverflow(showTaskOverflow === date ? null : date);
  }, [showTaskOverflow]);

  // Render task indicators for a date
  const renderTaskIndicators = (date, maxVisible = 3) => {
    const tasks = getTasksForDate(date);
    const visibleTasks = tasks.slice(0, maxVisible);
    const overflowCount = Math.max(0, tasks.length - maxVisible);

    return (
      <div className="space-y-1">
        {visibleTasks.map((task, index) => (
          <TaskIndicator
            key={task._id || task.id}
            task={task}
            onClick={handleTaskClick}
            index={index}
          />
        ))}
        
        {overflowCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleTaskOverflowClick(dateUtils.getDateKey(date), e)}
            className="w-full text-xs text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200 font-medium py-1 px-2 rounded bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            +{overflowCount} more
          </motion.button>
        )}
      </div>
    );
  };

  // Render date cell
  const renderDateCell = (date) => {
    const dateKey = dateUtils.getDateKey(date);
    const tasks = getTasksForDate(date);
    const isToday = dateUtils.isToday(date);
    const isCurrentMonth = dateUtils.isDateInCurrentMonth(date, currentDate);
    const isWeekend = dateUtils.isWeekend(date);
    const isHovered = hoveredDate && dateUtils.isSameDate(hoveredDate, date);
    const hasOverflow = showTaskOverflow === dateKey;

    return (
      <motion.div
        key={dateKey}
        data-date={dateKey}
        className={`
          relative min-h-[120px] p-2 border border-secondary-200 dark:border-secondary-700 
          cursor-pointer transition-all duration-200 rounded-lg group
          ${isCurrentMonth 
            ? 'bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700' 
            : 'bg-secondary-50 dark:bg-secondary-900'
          }
          ${isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
          ${isWeekend ? 'bg-secondary-25 dark:bg-secondary-850' : ''}
          ${isHovered ? 'shadow-md' : ''}
          ${!settings.showWeekends && isWeekend ? 'hidden' : ''}
        `}
        onClick={(e) => handleDateClick(date, e)}
        onMouseEnter={() => handleDateHover(date)}
        onMouseLeave={() => setHoveredDate(null)}
        whileHover={{ scale: 1.02 }}
        layout
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-2">
          <span className={`
            text-sm font-medium
            ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}
            ${!isCurrentMonth ? 'text-secondary-400 dark:text-secondary-500' : 'text-secondary-900 dark:text-secondary-100'}
          `}>
            {date.getDate()}
          </span>
          
          {/* Task count badge */}
          {tasks.length > 0 && (
            <span className={`
              inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full
              ${tasks.some(t => t.priority === 'high') 
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                : tasks.some(t => t.priority === 'medium')
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }
            `}>
              {tasks.length}
            </span>
          )}
        </div>

        {/* Task indicators */}
        {renderTaskIndicators(date)}

        {/* Quick add button (visible on hover) */}
        {isCurrentMonth && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            onClick={(e) => {
              e.stopPropagation();
              if (onCreateTask) onCreateTask(date);
            }}
            className="absolute bottom-2 right-2 w-6 h-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors"
            title="Add task"
          >
            +
          </motion.button>
        )}

        {/* Task overflow modal */}
        <AnimatePresence>
          {hasOverflow && (
            <TaskOverflowModal
              date={date}
              tasks={tasks}
              onClose={() => setShowTaskOverflow(null)}
              onTaskClick={handleTaskClick}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Generate calendar grid
  const calendarGrid = dateUtils.getCalendarGrid(currentDate, settings.weekStartsOn);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startDay = settings.weekStartsOn;
  const orderedDays = [...weekDays.slice(startDay), ...weekDays.slice(0, startDay)];

  return (
    <div className="month-view">
      {/* Week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {orderedDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <CalendarGrid
        onDateClick={handleDateClick}
        onTaskClick={handleTaskClick}
        onTaskDrop={handleTaskDrop}
        className="grid grid-cols-7 gap-1"
      >
        {calendarGrid.flat().map((date) => renderDateCell(date))}
      </CalendarGrid>
    </div>
  );
};

// Task indicator component
const TaskIndicator = ({ task, onClick, index }) => {
  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onClick(task, event);
  }, [task, onClick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        text-xs p-1.5 rounded cursor-pointer truncate font-medium
        ${taskCalendarUtils.getTaskColor(task)}
        text-white hover:shadow-sm transition-all duration-200
        ${task.status === 'completed' ? 'opacity-70 line-through' : ''}
      `}
      draggable
      onClick={handleClick}
      title={taskCalendarUtils.getTaskTooltipText(task)}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-1">
        {/* Priority indicator */}
        <div className={`
          w-2 h-2 rounded-full flex-shrink-0
          ${task.priority === 'high' ? 'bg-red-200' : 
            task.priority === 'medium' ? 'bg-yellow-200' : 'bg-green-200'}
        `} />
        
        {/* Task title */}
        <span className="truncate">
          {taskCalendarUtils.getTaskDisplayText(task, 12)}
        </span>
        
        {/* Status indicator */}
        {task.status === 'completed' && (
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </motion.div>
  );
};

// Task overflow modal component
const TaskOverflowModal = ({ date, tasks, onClose, onTaskClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50 max-h-64 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-secondary-200 dark:border-secondary-700">
        <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
          {dateUtils.formatDisplayDate(date)}
        </h3>
        <button
          onClick={onClose}
          className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Task list */}
      <div className="p-2 space-y-1">
        {tasks.map((task, index) => (
          <motion.div
            key={task._id || task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              p-2 rounded cursor-pointer transition-colors
              ${taskCalendarUtils.getTaskColor(task)}
              text-white hover:shadow-sm
            `}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, e);
              onClose();
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">
                {task.title}
              </span>
              <span className="text-xs opacity-75">
                {task.priority}
              </span>
            </div>
            {task.description && (
              <p className="text-xs opacity-75 mt-1 truncate">
                {task.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MonthView;