import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCalendar } from '../../../context/CalendarContext';
import { dateUtils } from '../../../utils/dateUtils';
import { taskCalendarUtils } from '../../../utils/taskCalendarUtils';

const WeekView = ({ 
  onDateClick, 
  onTaskClick, 
  onTaskDrop,
  onCreateTask 
}) => {
  const {
    currentDate,
    dateRange,
    getTasksForDate,
    setSelectedDate,
    settings,
    draggedTask,
    setDraggedTask
  } = useCalendar();

  const [hoveredTimeSlot, setHoveredTimeSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const weekGridRef = useRef(null);

  // Generate week days
  const weekDays = dateUtils.getWeekDays(dateRange.start, settings.weekStartsOn);
  
  // Generate time slots (6 AM to 11 PM by default)
  const timeSlots = dateUtils.getTimeSlots(6, 23, 60);

  // Handle time slot click
  const handleTimeSlotClick = useCallback((date, timeSlot, event) => {
    const slotDate = new Date(date);
    slotDate.setHours(timeSlot.hour, timeSlot.minutes);
    
    setSelectedDate(slotDate);
    if (onDateClick) {
      onDateClick(slotDate, event);
    }
    if (onCreateTask) {
      onCreateTask(slotDate);
    }
  }, [setSelectedDate, onDateClick, onCreateTask]);

  // Handle task click
  const handleTaskClick = useCallback((task, event) => {
    if (onTaskClick) {
      onTaskClick(task, event);
    }
  }, [onTaskClick]);

  // Handle drag and drop
  const handleDragStart = useCallback((event, task) => {
    setDraggedTask(task);
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: task._id || task.id,
      originalDate: task.due
    }));
    event.dataTransfer.effectAllowed = 'move';
  }, [setDraggedTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverSlot(null);
  }, [setDraggedTask]);

  const handleDragOver = useCallback((event, date, timeSlot) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const slotKey = `${dateUtils.getDateKey(date)}-${timeSlot.hour}`;
    setDragOverSlot(slotKey);
  }, []);

  const handleDrop = useCallback((event, date, timeSlot) => {
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      const { taskId, originalDate } = dragData;
      
      if (taskId && onTaskDrop) {
        const newDate = new Date(date);
        newDate.setHours(timeSlot.hour, timeSlot.minutes);
        onTaskDrop(taskId, newDate, originalDate);
      }
    } catch (error) {
      //console.error('Error handling task drop:', error);
    } finally {
      setDragOverSlot(null);
    }
  }, [onTaskDrop]);

  // Get tasks for a specific time slot
  const getTasksForTimeSlot = (date, timeSlot) => {
    const dayTasks = getTasksForDate(date);
    
    // For now, show all tasks for the day in the first hour slot
    // In a more advanced implementation, we could parse task times
    if (timeSlot.hour === 6) {
      return dayTasks;
    }
    
    return [];
  };

  // Render time column
  const renderTimeColumn = () => (
    <div className="time-column w-16 flex-shrink-0">
      {/* Header spacer */}
      <div className="h-12 border-b border-secondary-200 dark:border-secondary-700"></div>
      
      {/* Time slots */}
      {timeSlots.map((slot, index) => (
        <div
          key={slot.time}
          className="h-16 flex items-start justify-end pr-2 text-xs text-secondary-500 dark:text-secondary-400 border-b border-secondary-100 dark:border-secondary-800"
        >
          {index === 0 || slot.hour % 2 === 0 ? slot.time : ''}
        </div>
      ))}
    </div>
  );

  // Render day column
  const renderDayColumn = (date, dayIndex) => {
    const isToday = dateUtils.isToday(date);
    const isWeekend = dateUtils.isWeekend(date);
    
    return (
      <div key={dateUtils.getDateKey(date)} className="day-column flex-1 min-w-0">
        {/* Day header */}
        <motion.div
          className={`
            h-12 flex flex-col items-center justify-center border-b border-secondary-200 dark:border-secondary-700 cursor-pointer
            ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-secondary-800'}
            ${isWeekend ? 'bg-secondary-25 dark:bg-secondary-850' : ''}
            hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors
          `}
          onClick={(e) => handleTimeSlotClick(date, { hour: 9, minutes: 0 }, e)}
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xs text-secondary-500 dark:text-secondary-400 font-medium">
            {dateUtils.formatDisplayDate(date).split(',')[0]}
          </div>
          <div className={`
            text-lg font-bold
            ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}
          `}>
            {date.getDate()}
          </div>
        </motion.div>

        {/* Time slots */}
        {timeSlots.map((slot) => {
          const slotKey = `${dateUtils.getDateKey(date)}-${slot.hour}`;
          const tasks = getTasksForTimeSlot(date, slot);
          const isDragOver = dragOverSlot === slotKey;
          const isHovered = hoveredTimeSlot === slotKey;

          return (
            <motion.div
              key={slotKey}
              className={`
                relative h-16 border-b border-secondary-100 dark:border-secondary-800 cursor-pointer group
                ${isWeekend ? 'bg-secondary-25 dark:bg-secondary-850' : 'bg-white dark:bg-secondary-800'}
                ${isDragOver ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : ''}
                ${isHovered ? 'bg-secondary-50 dark:bg-secondary-700' : ''}
                hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors
              `}
              onClick={(e) => handleTimeSlotClick(date, slot, e)}
              onMouseEnter={() => setHoveredTimeSlot(slotKey)}
              onMouseLeave={() => setHoveredTimeSlot(null)}
              onDragOver={(e) => handleDragOver(e, date, slot)}
              onDrop={(e) => handleDrop(e, date, slot)}
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              {/* Tasks in this slot */}
              <div className="absolute inset-1 space-y-1">
                {tasks.map((task, taskIndex) => (
                  <TaskBlock
                    key={task._id || task.id}
                    task={task}
                    onClick={handleTaskClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    index={taskIndex}
                  />
                ))}
              </div>

              {/* Quick add indicator */}
              {isHovered && tasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-xs text-secondary-400 dark:text-secondary-500 font-medium">
                    Click to add task
                  </div>
                </motion.div>
              )}

              {/* Drop zone indicator */}
              {isDragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 border-2 border-dashed border-green-400 bg-green-50 dark:bg-green-900/20 rounded flex items-center justify-center"
                >
                  <div className="text-green-600 dark:text-green-400 text-xs font-medium">
                    Drop here
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="week-view h-full flex flex-col">
      {/* Week navigation info */}
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          {dateUtils.formatWeekRange(dateRange.start, dateRange.end)}
        </h2>
      </div>

      {/* Week grid */}
      <div 
        ref={weekGridRef}
        className="flex-1 flex overflow-x-auto overflow-y-auto border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800"
      >
        {/* Time column */}
        {renderTimeColumn()}

        {/* Day columns */}
        {weekDays.map((date, index) => renderDayColumn(date, index))}
      </div>

      {/* Current time indicator */}
      <CurrentTimeIndicator weekDays={weekDays} timeSlots={timeSlots} />
    </div>
  );
};

// Task block component for week view
const TaskBlock = ({ task, onClick, onDragStart, onDragEnd, index }) => {
  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onClick(task, event);
  }, [task, onClick]);

  const handleDragStart = useCallback((event) => {
    onDragStart(event, task);
  }, [task, onDragStart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`
        p-1.5 rounded text-xs font-medium cursor-pointer truncate
        ${taskCalendarUtils.getTaskColor(task)}
        text-white hover:shadow-md transition-all duration-200
        ${task.status === 'completed' ? 'opacity-70 line-through' : ''}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      title={taskCalendarUtils.getTaskTooltipText(task)}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-1">
        {/* Priority indicator */}
        <div className={`
          w-1.5 h-1.5 rounded-full flex-shrink-0
          ${task.priority === 'high' ? 'bg-red-200' : 
            task.priority === 'medium' ? 'bg-yellow-200' : 'bg-green-200'}
        `} />
        
        {/* Task title */}
        <span className="truncate">
          {taskCalendarUtils.getTaskDisplayText(task, 20)}
        </span>
      </div>
      
      {/* Task time (if available) */}
      {task.due && (
        <div className="text-xs opacity-75 mt-0.5">
          {dateUtils.formatTimeSlot(task.due)}
        </div>
      )}
    </motion.div>
  );
};

// Current time indicator component
const CurrentTimeIndicator = ({ weekDays, timeSlots }) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  
  // Only show if current time is within our time range
  if (currentHour < 6 || currentHour > 23) {
    return null;
  }

  // Check if today is in the current week
  const todayInWeek = weekDays.find(day => dateUtils.isToday(day));
  if (!todayInWeek) {
    return null;
  }

  // Calculate position
  const dayIndex = weekDays.findIndex(day => dateUtils.isToday(day));
  const timeProgress = (currentHour - 6) + (currentMinutes / 60);
  const topPosition = 48 + (timeProgress * 64); // 48px header + time slots

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute pointer-events-none z-10"
      style={{
        left: `${64 + (dayIndex * (100 / weekDays.length))}%`, // 64px time column width
        top: `${topPosition}px`,
        width: `${100 / weekDays.length}%`
      }}
    >
      {/* Time indicator line */}
      <div className="relative">
        <div className="absolute left-0 w-full h-0.5 bg-red-500"></div>
        <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
        <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
      </div>
      
      {/* Current time label */}
      <div className="absolute -top-6 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
        {dateUtils.formatTimeSlot(now)}
      </div>
    </motion.div>
  );
};

export default WeekView;