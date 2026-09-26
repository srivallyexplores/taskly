import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const CalendarView = ({ 
  tasks = [], 
  events = [], 
  onTaskClick, 
  onEventClick, 
  onDateClick,
  onTaskCreate,
  className = '' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Get calendar data for current view
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };
  
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };
  
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const getEventsForDate = (date) => {
    return events.filter(event => {
      if (!event.start) return false;
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };
  
  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };
  
  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };
  
  const handleNavigation = (direction) => {
    switch (viewMode) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };
  
  const getViewTitle = () => {
    const options = { year: 'numeric', month: 'long' };
    
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
        }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return '';
    }
  };
  
  const renderMonthView = () => {
    const days = getCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-secondary-600 dark:text-secondary-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const dayTasks = getTasksForDate(day);
          const dayEvents = getEventsForDate(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDateClick(day)}
              className={`
                relative p-2 min-h-[80px] border border-secondary-200 dark:border-secondary-700 rounded-lg cursor-pointer transition-all duration-200
                ${isCurrentMonthDay 
                  ? 'bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-700' 
                  : 'bg-secondary-50 dark:bg-secondary-900 text-secondary-400 dark:text-secondary-500'
                }
                ${isTodayDay ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium ${isTodayDay ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                  {day.getDate()}
                </span>
                {(dayTasks.length > 0 || dayEvents.length > 0) && (
                  <div className="flex space-x-1">
                    {dayTasks.length > 0 && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                    {dayEvents.length > 0 && (
                      <div className="w-2 h-2 bg-success-500 rounded-full" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Tasks and Events */}
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                    className={`
                      text-xs p-1 rounded truncate cursor-pointer transition-colors
                      ${task.priority === 'high' 
                        ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300' 
                        : task.priority === 'medium'
                        ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300'
                        : 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300'
                      }
                    `}
                  >
                    {task.title}
                  </motion.div>
                ))}
                
                {dayEvents.slice(0, 1).map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                    className="text-xs p-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded truncate cursor-pointer"
                  >
                    📅 {event.title}
                  </motion.div>
                ))}
                
                {(dayTasks.length + dayEvents.length) > 3 && (
                  <div className="text-xs text-secondary-500 dark:text-secondary-400">
                    +{(dayTasks.length + dayEvents.length) - 3} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };
  
  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="flex flex-col">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1 mb-4">
          <div className="p-2"></div> {/* Time column header */}
          {days.map((day) => (
            <div key={day.toISOString()} className="p-2 text-center">
              <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-lg font-bold ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-600 dark:text-secondary-400'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Week grid */}
        <div className="flex-1 overflow-y-auto max-h-96">
          <div className="grid grid-cols-8 gap-1">
            {/* Time column */}
            <div className="space-y-12">
              {hours.map((hour) => (
                <div key={hour} className="text-xs text-secondary-500 dark:text-secondary-400 text-right pr-2">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {days.map((day) => {
              const dayTasks = getTasksForDate(day);
              const dayEvents = getEventsForDate(day);
              
              return (
                <div key={day.toISOString()} className="relative border-l border-secondary-200 dark:border-secondary-700">
                  {hours.map((hour) => (
                    <div key={hour} className="h-12 border-b border-secondary-100 dark:border-secondary-800" />
                  ))}
                  
                  {/* Tasks and events positioned by time */}
                  {dayTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => onTaskClick?.(task)}
                      className="absolute left-1 right-1 p-1 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 rounded text-xs cursor-pointer z-10"
                      style={{ 
                        top: `${(index * 2) + 1}rem`,
                        height: '1.5rem'
                      }}
                    >
                      {task.title}
                    </motion.div>
                  ))}
                  
                  {dayEvents.map((event, index) => {
                    const startHour = new Date(event.start).getHours();
                    const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60 * 60);
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onEventClick?.(event)}
                        className="absolute left-1 right-1 p-1 bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-300 rounded text-xs cursor-pointer z-10"
                        style={{ 
                          top: `${startHour * 3}rem`,
                          height: `${Math.max(duration * 3, 1.5)}rem`
                        }}
                      >
                        📅 {event.title}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        {/* Day summary */}
        <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <div>
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
              {dayTasks.length} tasks, {dayEvents.length} events
            </h4>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {isToday(currentDate) ? 'Today' : currentDate.toLocaleDateString()}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onTaskCreate?.(currentDate)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        {/* Timeline */}
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourTasks = dayTasks.filter(task => {
              if (!task.dueDate) return false;
              return new Date(task.dueDate).getHours() === hour;
            });
            
            const hourEvents = dayEvents.filter(event => {
              return new Date(event.start).getHours() === hour;
            });
            
            return (
              <div key={hour} className="flex">
                <div className="w-16 text-sm text-secondary-500 dark:text-secondary-400 text-right pr-4 py-2">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
                
                <div className="flex-1 border-l border-secondary-200 dark:border-secondary-700 pl-4 py-2 min-h-[3rem]">
                  <div className="space-y-2">
                    {hourEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onEventClick?.(event)}
                        className="flex items-center space-x-2 p-2 bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-300 rounded-lg cursor-pointer"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{event.title}</span>
                        <span className="text-xs">
                          {new Date(event.start).toLocaleTimeString()} - {new Date(event.end).toLocaleTimeString()}
                        </span>
                      </motion.div>
                    ))}
                    
                    {hourTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onTaskClick?.(task)}
                        className={`
                          flex items-center space-x-2 p-2 rounded-lg cursor-pointer
                          ${task.priority === 'high' 
                            ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300' 
                            : task.priority === 'medium'
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300'
                            : 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                          }
                        `}
                      >
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{task.title}</span>
                        {task.priority === 'high' && (
                          <ExclamationTriangleIcon className="w-4 h-4" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(-1)}
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {getViewTitle()}
          </h2>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation(1)}
          >
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View mode selector */}
          <div className="flex bg-secondary-100 dark:bg-secondary-700 rounded-lg p-1">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize
                  ${viewMode === mode
                    ? 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
                  }
                `}
              >
                {mode}
              </button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>
      
      {/* Calendar Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CalendarView;