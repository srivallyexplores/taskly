import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';

const CalendarGrid = ({ 
  children, 
  onDateClick, 
  onTaskDrop, 
  onTaskClick,
  className = '' 
}) => {
  const {
    currentView,
    currentDate,
    draggedTask,
    setDraggedTask,
    getTasksForDate,
    settings
  } = useCalendar();

  const gridRef = useRef(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag and drop events
  const handleDragStart = useCallback((event, task) => {
    setDraggedTask(task);
    setIsDragging(true);
    
    // Set drag data
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task._id || task.id,
      originalDate: task.due
    }));
    
    // Set drag effect
    event.dataTransfer.effectAllowed = 'move';
    
    // Add dragging class to body for global styling
    document.body.classList.add('calendar-dragging');
  }, [setDraggedTask]);

  const handleDragEnd = useCallback((event) => {
    setDraggedTask(null);
    setIsDragging(false);
    setDragOverDate(null);
    
    // Remove dragging class from body
    document.body.classList.remove('calendar-dragging');
  }, [setDraggedTask]);

  const handleDragOver = useCallback((event, date) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    if (date && !dateUtils.isSameDate(date, dragOverDate)) {
      setDragOverDate(date);
    }
  }, [dragOverDate]);

  const handleDragLeave = useCallback((event) => {
    // Only clear drag over if we're leaving the grid entirely
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = event;
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setDragOverDate(null);
      }
    }
  }, []);

  const handleDrop = useCallback((event, targetDate) => {
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      const { taskId, originalDate } = dragData;
      
      if (taskId && targetDate && onTaskDrop) {
        // Validate the drop
        if (taskCalendarUtils.validateTaskDrop(draggedTask, targetDate)) {
          onTaskDrop(taskId, targetDate, originalDate);
        }
      }
    } catch (error) {
      //console.error('Error handling task drop:', error);
    } finally {
      setDragOverDate(null);
      setDraggedTask(null);
      setIsDragging(false);
    }
  }, [draggedTask, onTaskDrop]);

  // Handle date cell click
  const handleDateClick = useCallback((date, event) => {
    if (onDateClick) {
      onDateClick(date, event);
    }
  }, [onDateClick]);

  // Handle task click
  const handleTaskClick = useCallback((task, event) => {
    event.stopPropagation(); // Prevent date click
    if (onTaskClick) {
      onTaskClick(task, event);
    }
  }, [onTaskClick]);

  // Get grid layout classes based on view
  const getGridClasses = () => {
    const baseClasses = 'calendar-grid relative';
    
    switch (currentView) {
      case 'month':
        return `${baseClasses} grid grid-cols-7 gap-1`;
      case 'week':
        return `${baseClasses} grid grid-cols-8 gap-1`; // 8 cols: time + 7 days
      case 'day':
        return `${baseClasses} grid grid-cols-2 gap-4`; // 2 cols: time + day content
      case 'agenda':
        return `${baseClasses} flex flex-col space-y-2`;
      default:
        return `${baseClasses} grid grid-cols-7 gap-1`;
    }
  };

  // Render date cell for month/week views
  const renderDateCell = (date, isCurrentMonth = true) => {
    const dateKey = dateUtils.getDateKey(date);
    const tasks = getTasksForDate(date);
    const isToday = dateUtils.isToday(date);
    const isSelected = dateUtils.isSameDate(date, currentDate);
    const isDragOver = dragOverDate && dateUtils.isSameDate(date, dragOverDate);
    const isWeekend = dateUtils.isWeekend(date);

    return (
      <motion.div
        key={dateKey}
        data-date={dateKey}
        className={`
          calendar-date-cell relative min-h-[80px] p-2 border border-secondary-200 dark:border-secondary-700 
          cursor-pointer transition-all duration-200 rounded-lg
          ${isCurrentMonth 
            ? 'bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700' 
            : 'bg-secondary-50 dark:bg-secondary-900 text-secondary-400 dark:text-secondary-500'
          }
          ${isToday ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
          ${isSelected ? 'ring-2 ring-primary-300' : ''}
          ${isDragOver ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20' : ''}
          ${isWeekend && !settings.showWeekends ? 'hidden' : ''}
          ${isDragging ? 'transition-all duration-200' : ''}
        `}
        onClick={(e) => handleDateClick(date, e)}
        onDragOver={(e) => handleDragOver(e, date)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, date)}
        whileHover={{ scale: 1.02 }}
        layout
      >
        {/* Date number */}
        <div className={`
          text-sm font-medium mb-1
          ${isToday ? 'text-primary-600 dark:text-primary-400 font-bold' : ''}
          ${!isCurrentMonth ? 'text-secondary-400 dark:text-secondary-500' : 'text-secondary-900 dark:text-secondary-100'}
        `}>
          {date.getDate()}
        </div>

        {/* Task indicators */}
        <div className="space-y-1">
          {tasks.slice(0, 3).map((task, index) => (
            <motion.div
              key={task._id || task.id}
              className={`
                text-xs p-1 rounded truncate cursor-pointer
                ${taskCalendarUtils.getTaskColor(task)}
                text-white font-medium
                hover:shadow-sm transition-shadow
              `}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onClick={(e) => handleTaskClick(task, e)}
              title={taskCalendarUtils.getTaskTooltipText(task)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {taskCalendarUtils.getTaskDisplayText(task, 15)}
            </motion.div>
          ))}
          
          {/* Show more indicator */}
          {tasks.length > 3 && (
            <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
              +{tasks.length - 3} more
            </div>
          )}
        </div>

        {/* Drop zone indicator */}
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center"
          >
            <div className="text-green-600 dark:text-green-400 text-sm font-medium">
              Drop here
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Render week header for month view
  const renderWeekHeader = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startDay = settings.weekStartsOn;
    const orderedDays = [...weekDays.slice(startDay), ...weekDays.slice(0, startDay)];

    return (
      <>
        {orderedDays.map((day, index) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-secondary-600 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-700 rounded-lg"
          >
            {day}
          </div>
        ))}
      </>
    );
  };

  // Render month grid
  const renderMonthGrid = () => {
    const calendarGrid = dateUtils.getCalendarGrid(currentDate, settings.weekStartsOn);
    
    return (
      <>
        {renderWeekHeader()}
        {calendarGrid.flat().map((date) => {
          const isCurrentMonth = dateUtils.isDateInCurrentMonth(date, currentDate);
          return renderDateCell(date, isCurrentMonth);
        })}
      </>
    );
  };

  // Render content based on current view
  const renderGridContent = () => {
    switch (currentView) {
      case 'month':
        return renderMonthGrid();
      case 'week':
      case 'day':
      case 'agenda':
        // These will be handled by their respective view components
        return children;
      default:
        return renderMonthGrid();
    }
  };

  return (
    <div
      ref={gridRef}
      className={`${getGridClasses()} ${className}`}
      onDragLeave={handleDragLeave}
    >
      {renderGridContent()}
      
      {/* Global drag overlay */}
      {isDragging && draggedTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 pointer-events-none z-50"
        >
          <div className="absolute top-4 left-4 bg-white dark:bg-secondary-800 p-3 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Moving: {taskCalendarUtils.getTaskDisplayText(draggedTask, 30)}
            </div>
            <div className="text-xs text-secondary-500 dark:text-secondary-400">
              Drop on a date to reschedule
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendarGrid;