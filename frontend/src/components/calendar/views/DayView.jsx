import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendar } from '../../../context/CalendarContext';
import { dateUtils } from '../../../utils/dateUtils';
import { taskCalendarUtils } from '../../../utils/taskCalendarUtils';

const DayView = ({ 
  onDateClick, 
  onTaskClick, 
  onTaskDrop,
  onCreateTask 
}) => {
  const {
    currentDate,
    getTasksForDate,
    setSelectedDate,
    settings,
    draggedTask,
    setDraggedTask
  } = useCalendar();

  const [hoveredTimeSlot, setHoveredTimeSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const dayGridRef = useRef(null);
  const currentTimeRef = useRef(null);

  // Generate time slots (24 hours with 30-minute intervals)
  const timeSlots = dateUtils.getTimeSlots(0, 24, 30);
  
  // Get tasks for the current day
  const dayTasks = getTasksForDate(currentDate);

  // Scroll to current time on mount
  useEffect(() => {
    if (dateUtils.isToday(currentDate) && currentTimeRef.current) {
      currentTimeRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentDate]);

  // Handle time slot click
  const handleTimeSlotClick = useCallback((timeSlot, event) => {
    const slotDate = new Date(currentDate);
    slotDate.setHours(timeSlot.hour, timeSlot.minutes);
    
    setSelectedDate(slotDate);
    setSelectedTimeSlot(timeSlot);
    
    if (onDateClick) {
      onDateClick(slotDate, event);
    }
    if (onCreateTask) {
      onCreateTask(slotDate);
    }
  }, [currentDate, setSelectedDate, onDateClick, onCreateTask]);

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

  const handleDragOver = useCallback((event, timeSlot) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const slotKey = `${timeSlot.hour}-${timeSlot.minutes}`;
    setDragOverSlot(slotKey);
  }, []);

  const handleDrop = useCallback((event, timeSlot) => {
    event.preventDefault();
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      const { taskId, originalDate } = dragData;
      
      if (taskId && onTaskDrop) {
        const newDate = new Date(currentDate);
        newDate.setHours(timeSlot.hour, timeSlot.minutes);
        onTaskDrop(taskId, newDate, originalDate);
      }
    } catch (error) {
      //console.error('Error handling task drop:', error);
    } finally {
      setDragOverSlot(null);
    }
  }, [currentDate, onTaskDrop]);

  // Get tasks for a specific time slot
  const getTasksForTimeSlot = (timeSlot) => {
    // For now, show all tasks in the morning slots
    // In a more advanced implementation, we could parse task times
    const slotHour = timeSlot.hour;
    
    if (slotHour >= 9 && slotHour < 12) {
      return dayTasks.filter((_, index) => index % 3 === 0);
    } else if (slotHour >= 14 && slotHour < 17) {
      return dayTasks.filter((_, index) => index % 3 === 1);
    } else if (slotHour >= 19 && slotHour < 21) {
      return dayTasks.filter((_, index) => index % 3 === 2);
    }
    
    return [];
  };

  // Check if current time is in this slot
  const isCurrentTimeSlot = (timeSlot) => {
    if (!dateUtils.isToday(currentDate)) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    return currentHour === timeSlot.hour && 
           currentMinutes >= timeSlot.minutes && 
           currentMinutes < timeSlot.minutes + 30;
  };

  // Get current time position for the indicator
  const getCurrentTimePosition = () => {
    if (!dateUtils.isToday(currentDate)) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    // Calculate position based on 30-minute slots (64px each)
    const totalMinutes = currentHour * 60 + currentMinutes;
    const slotHeight = 64; // Height of each 30-minute slot
    const position = (totalMinutes / 30) * slotHeight;
    
    return position;
  };

  return (
    <div className="day-view h-full flex flex-col">
      {/* Day header */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          {dateUtils.formatDisplayDate(currentDate)}
        </h2>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Day grid container */}
      <div className="flex-1 flex border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-800 overflow-hidden">
        {/* Time column */}
        <div className="time-column w-20 flex-shrink-0 bg-secondary-50 dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700">
          {timeSlots.map((slot, index) => (
            <div
              key={`${slot.hour}-${slot.minutes}`}
              className={`
                h-16 flex items-start justify-end pr-3 text-xs font-medium border-b border-secondary-200 dark:border-secondary-700
                ${slot.minutes === 0 ? 'text-secondary-700 dark:text-secondary-300' : 'text-secondary-400 dark:text-secondary-500'}
                ${isCurrentTimeSlot(slot) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              {slot.minutes === 0 ? slot.time : ''}
            </div>
          ))}
        </div>

        {/* Main day content */}
        <div 
          ref={dayGridRef}
          className="flex-1 relative overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {timeSlots.map((slot) => {
            const slotKey = `${slot.hour}-${slot.minutes}`;
            const tasks = getTasksForTimeSlot(slot);
            const isDragOver = dragOverSlot === slotKey;
            const isHovered = hoveredTimeSlot === slotKey;
            const isSelected = selectedTimeSlot && 
              selectedTimeSlot.hour === slot.hour && 
              selectedTimeSlot.minutes === slot.minutes;
            const isCurrent = isCurrentTimeSlot(slot);

            return (
              <motion.div
                key={slotKey}
                className={`
                  relative h-16 border-b border-secondary-100 dark:border-secondary-800 cursor-pointer group
                  ${isDragOver ? 'bg-green-50 dark:bg-green-900/20 border-green-300' : ''}
                  ${isHovered ? 'bg-secondary-50 dark:bg-secondary-700' : ''}
                  ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  ${isCurrent ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                  hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors
                `}
                onClick={(e) => handleTimeSlotClick(slot, e)}
                onMouseEnter={() => setHoveredTimeSlot(slotKey)}
                onMouseLeave={() => setHoveredTimeSlot(null)}
                onDragOver={(e) => handleDragOver(e, slot)}
                onDrop={(e) => handleDrop(e, slot)}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              >
                {/* Time slot label */}
                <div className="absolute top-1 left-2 text-xs text-secondary-400 dark:text-secondary-500">
                  {slot.time}
                </div>

                {/* Tasks in this slot */}
                <div className="absolute inset-2 top-6 space-y-1">
                  {tasks.map((task, taskIndex) => (
                    <TaskBlock
                      key={task._id || task.id}
                      task={task}
                      onClick={handleTaskClick}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      index={taskIndex}
                      isDetailed={true}
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
                    <div className="text-sm text-secondary-400 dark:text-secondary-500 font-medium">
                      Click to add task at {slot.time}
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
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Drop here for {slot.time}
                    </div>
                  </motion.div>
                )}

                {/* Current time marker */}
                {isCurrent && (
                  <div 
                    ref={currentTimeRef}
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                    style={{ top: `${(new Date().getMinutes() % 30) / 30 * 64}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* All-day tasks section */}
          {dayTasks.length > 0 && (
            <AllDayTasksSection
              tasks={dayTasks}
              onTaskClick={handleTaskClick}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>
      </div>

      {/* Day summary */}
      <DaySummary tasks={dayTasks} date={currentDate} />
    </div>
  );
};

// Task block component for day view
const TaskBlock = ({ task, onClick, onDragStart, onDragEnd, index, isDetailed = false }) => {
  const handleClick = useCallback((event) => {
    event.stopPropagation();
    onClick(task, event);
  }, [task, onClick]);

  const handleDragStart = useCallback((event) => {
    onDragStart(event, task);
  }, [task, onDragStart]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        p-2 rounded-lg cursor-pointer shadow-sm border-l-4
        ${taskCalendarUtils.getTaskColor(task)}
        text-white hover:shadow-md transition-all duration-200
        ${task.status === 'completed' ? 'opacity-70' : ''}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      title={taskCalendarUtils.getTaskTooltipText(task)}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Task title */}
          <h4 className={`
            text-sm font-semibold truncate
            ${task.status === 'completed' ? 'line-through' : ''}
          `}>
            {task.title}
          </h4>
          
          {/* Task description (if detailed view) */}
          {isDetailed && task.description && (
            <p className="text-xs opacity-90 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Task metadata */}
          <div className="flex items-center space-x-2 mt-1 text-xs opacity-75">
            <span className="capitalize">{task.priority}</span>
            {task.tags && task.tags.length > 0 && (
              <span>• {task.tags.slice(0, 2).join(', ')}</span>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0 ml-2">
          {task.status === 'completed' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// All-day tasks section
const AllDayTasksSection = ({ tasks, onTaskClick, onDragStart, onDragEnd }) => {
  const allDayTasks = tasks.filter(task => !task.time); // Tasks without specific time

  if (allDayTasks.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 p-2 z-20">
      <div className="text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-2">
        All Day
      </div>
      <div className="space-y-1">
        {allDayTasks.slice(0, 3).map((task, index) => (
          <div
            key={task._id || task.id}
            className={`
              text-xs p-1.5 rounded cursor-pointer truncate
              ${taskCalendarUtils.getTaskColor(task)}
              text-white hover:shadow-sm transition-shadow
            `}
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onDragEnd={onDragEnd}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, e);
            }}
          >
            {task.title}
          </div>
        ))}
        {allDayTasks.length > 3 && (
          <div className="text-xs text-secondary-500 dark:text-secondary-400">
            +{allDayTasks.length - 3} more all-day tasks
          </div>
        )}
      </div>
    </div>
  );
};

// Day summary component
const DaySummary = ({ tasks, date }) => {
  const stats = taskCalendarUtils.getDateTaskStats(tasks, date);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg"
    >
      <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
        Day Summary
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
            {stats.total}
          </div>
          <div className="text-secondary-600 dark:text-secondary-400">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {stats.completed}
          </div>
          <div className="text-secondary-600 dark:text-secondary-400">Completed</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {stats.inProgress}
          </div>
          <div className="text-secondary-600 dark:text-secondary-400">In Progress</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            {stats.overdue}
          </div>
          <div className="text-secondary-600 dark:text-secondary-400">Overdue</div>
        </div>
      </div>
    </motion.div>
  );
};

export default DayView;