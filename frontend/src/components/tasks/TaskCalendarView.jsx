import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';

const TaskCalendarView = ({ 
  tasks = [], 
  onTaskClick, 
  onDateClick,
  loading = false 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.due);
      return isSameDay(taskDate, date);
    });
  };
  
  // Get tasks for selected date
  const selectedDateTasks = getTasksForDate(selectedDate);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-error-500';
      case 'medium':
        return 'bg-warning-500';
      case 'low':
        return 'bg-success-500';
      default:
        return 'bg-secondary-400';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-success-300 bg-success-50 dark:bg-success-900/20';
      case 'in-progress':
        return 'border-primary-300 bg-primary-50 dark:bg-primary-900/20';
      case 'failed':
        return 'border-error-300 bg-error-50 dark:bg-error-900/20';
      default:
        return 'border-secondary-300 bg-secondary-50 dark:bg-secondary-800';
    }
  };
  
  const navigateMonth = (direction) => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-secondary-200 dark:bg-secondary-700 rounded w-32"></div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-3">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center">
              <span className="text-sm font-medium text-secondary-500 dark:text-secondary-400">
                {day}
              </span>
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            
            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDateClick(day)}
                className={`
                  relative p-2 h-24 rounded-lg border transition-all duration-200 text-left
                  ${isSelected 
                    ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                  }
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isTodayDate ? 'ring-2 ring-primary-500 ring-opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isTodayDate 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-secondary-900 dark:text-secondary-100'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium text-white bg-primary-500 rounded-full">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                
                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task, index) => (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded truncate border-l-2 ${getStatusColor(task.status)}`}
                      style={{ borderLeftColor: getPriorityColor(task.priority).replace('bg-', '') }}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Selected Date Tasks */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-5 h-5 text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {format(selectedDate, 'MMM d, yyyy')}
            </h3>
          </div>
          
          {selectedDateTasks.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No tasks scheduled
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${getStatusColor(task.status)}`}
                  onClick={() => onTaskClick && onTaskClick(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 line-clamp-2">
                      {task.title}
                    </h4>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} flex-shrink-0 ml-2 mt-1`}></div>
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.status === 'completed' 
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300'
                        : task.status === 'in-progress'
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </span>
                    
                    <div className="flex items-center">
                      <FlagIcon className={`w-3 h-3 mr-1 ${
                        task.priority === 'high' ? 'text-error-500' :
                        task.priority === 'medium' ? 'text-warning-500' :
                        'text-success-500'
                      }`} />
                      <span className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendarView;