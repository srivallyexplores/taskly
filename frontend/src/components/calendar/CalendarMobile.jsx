import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format, addDays, subDays, startOfWeek, endOfWeek, isSameDay, isToday } from 'date-fns';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';
import CalendarTaskCard from './CalendarTaskCard';
import TaskQuickCreate from './TaskQuickCreate';
import CalendarFilters from './CalendarFilters';
import CalendarSearch from './CalendarSearch';

const CalendarMobile = ({
  onTaskClick,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  className = ''
}) => {
  const {
    currentDate,
    setCurrentDate,
    currentView,
    setView,
    filteredTasks,
    selectedDate,
    setSelectedDate
  } = useCalendar();

  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  // Mobile view options
  const mobileViews = [
    { key: 'day', label: 'Day', icon: CalendarIcon },
    { key: 'week', label: 'Week', icon: Squares2X2Icon },
    { key: 'agenda', label: 'List', icon: ListBulletIcon }
  ];

  // Handle swipe navigation
  const handleSwipeStart = useCallback((event) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isDragging.current = false;
  }, []);

  const handleSwipeMove = useCallback((event) => {
    if (!isDragging.current) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX.current);
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // Only start dragging if horizontal movement is greater than vertical
      if (deltaX > deltaY && deltaX > 10) {
        isDragging.current = true;
        event.preventDefault();
      }
    }
    
    if (isDragging.current) {
      const touch = event.touches[0];
      const offset = touch.clientX - touchStartX.current;
      setDragOffset(offset);
    }
  }, []);

  const handleSwipeEnd = useCallback((event) => {
    if (!isDragging.current) return;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        handlePrevious();
        setSwipeDirection('right');
      } else {
        // Swipe left - go to next
        handleNext();
        setSwipeDirection('left');
      }
    }
    
    setDragOffset(0);
    isDragging.current = false;
    
    // Clear swipe direction after animation
    setTimeout(() => setSwipeDirection(null), 300);
  }, []);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    switch (currentView) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subDays(currentDate, 7));
        break;
      case 'agenda':
        setCurrentDate(subDays(currentDate, 7));
        break;
      default:
        break;
    }
  }, [currentView, currentDate, setCurrentDate]);

  const handleNext = useCallback(() => {
    switch (currentView) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'agenda':
        setCurrentDate(addDays(currentDate, 7));
        break;
      default:
        break;
    }
  }, [currentView, currentDate, setCurrentDate]);

  // Get tasks for current view
  const getViewTasks = useCallback(() => {
    switch (currentView) {
      case 'day':
        return filteredTasks.filter(task => 
          task.due && isSameDay(new Date(task.due), currentDate)
        );
      case 'week':
        const weekStart = startOfWeek(currentDate);
        const weekEnd = endOfWeek(currentDate);
        return filteredTasks.filter(task => {
          if (!task.due) return false;
          const taskDate = new Date(task.due);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      case 'agenda':
        return filteredTasks
          .filter(task => task.due && new Date(task.due) >= new Date())
          .sort((a, b) => new Date(a.due) - new Date(b.due))
          .slice(0, 50); // Limit for performance
      default:
        return [];
    }
  }, [currentView, currentDate, filteredTasks]);

  const viewTasks = getViewTasks();

  // Render day view
  const renderDayView = () => {
    const dayTasks = viewTasks;
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Date Header */}
        <div className="sticky top-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 p-4 z-10">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {format(currentDate, 'EEEE')}
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {format(currentDate, 'MMMM d, yyyy')}
            </p>
            {isToday(currentDate) && (
              <span className="inline-block mt-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                Today
              </span>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="p-4 space-y-3">
          {dayTasks.length > 0 ? (
            dayTasks.map(task => (
              <CalendarTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                compact={true}
                showTime={true}
                className="w-full"
              />
            ))
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">
                No tasks for this day
              </p>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="mt-2 text-primary-600 dark:text-primary-400 text-sm hover:underline"
              >
                Add a task
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex-1 overflow-y-auto">
        {/* Week Header */}
        <div className="sticky top-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700 z-10">
          <div className="grid grid-cols-7 gap-1 p-2">
            {weekDays.map(day => {
              const dayTasks = viewTasks.filter(task => 
                task.due && isSameDay(new Date(task.due), day)
              );
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setView('day');
                  }}
                  className={`
                    p-2 rounded-lg text-center transition-colors
                    ${isSameDay(day, currentDate) 
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                      : 'hover:bg-secondary-100 dark:hover:bg-secondary-700'
                    }
                    ${isToday(day) ? 'ring-2 ring-primary-500' : ''}
                  `}
                >
                  <div className="text-xs text-secondary-600 dark:text-secondary-400">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-sm font-medium ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}`}>
                    {format(day, 'd')}
                  </div>
                  {dayTasks.length > 0 && (
                    <div className="flex justify-center mt-1">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Week Tasks */}
        <div className="p-4 space-y-3">
          {viewTasks.length > 0 ? (
            viewTasks.map(task => (
              <CalendarTaskCard
                key={task._id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                compact={true}
                showDate={true}
                showTime={true}
                className="w-full"
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Squares2X2Icon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">
                No tasks this week
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    const groupedTasks = viewTasks.reduce((groups, task) => {
      if (!task.due) return groups;
      
      const dateKey = format(new Date(task.due), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(task.due),
          tasks: []
        };
      }
      groups[dateKey].tasks.push(task);
      return groups;
    }, {});

    const sortedGroups = Object.values(groupedTasks).sort((a, b) => a.date - b.date);

    return (
      <div className="flex-1 overflow-y-auto">
        {sortedGroups.length > 0 ? (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {sortedGroups.map(group => (
              <div key={group.date.toISOString()} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {isToday(group.date) ? 'Today' :
                     format(group.date, 'EEEE, MMMM d')}
                  </h3>
                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                    {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {group.tasks.map(task => (
                    <CalendarTaskCard
                      key={task._id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      compact={true}
                      showTime={true}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <ListBulletIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <p className="text-secondary-500 dark:text-secondary-400">
              No upcoming tasks
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderDayView();
    }
  };

  return (
    <div className={`calendar-mobile flex flex-col h-full bg-white dark:bg-secondary-900 ${className}`}>
      {/* Mobile Header */}
      <div className="flex-shrink-0 bg-white dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                {currentView === 'day' && format(currentDate, 'MMM d, yyyy')}
                {currentView === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d')}`}
                {currentView === 'agenda' && 'Upcoming Tasks'}
              </h1>
            </div>
            
            <button
              onClick={handleNext}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`
                p-2 rounded-lg transition-colors
                ${showSearch 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }
              `}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg transition-colors
                ${showFilters 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                }
              `}
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setShowQuickCreate(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Add Task</span>
          </button>
        </div>

        {/* View Selector */}
        <div className="flex items-center justify-center px-4 pb-3">
          <div className="flex bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
            {mobileViews.map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.key}
                  onClick={() => setView(view.key)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${currentView === view.key
                      ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-secondary-200 dark:border-secondary-700 overflow-hidden"
          >
            <div className="p-4">
              <CalendarSearch
                onTaskSelect={(task) => {
                  onTaskClick?.(task);
                  setShowSearch(false);
                }}
                onClose={() => setShowSearch(false)}
                placeholder="Search tasks..."
                compact={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-secondary-200 dark:border-secondary-700 overflow-hidden"
          >
            <div className="p-4">
              <CalendarFilters
                compact={true}
                onFilterChange={() => {}}
                onResetFilters={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{
          transform: `translateX(${dragOffset}px)`,
        }}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        animate={{
          x: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        {renderCurrentView()}
      </motion.div>

      {/* Quick Create Modal */}
      <AnimatePresence>
        {showQuickCreate && (
          <TaskQuickCreate
            isOpen={showQuickCreate}
            onClose={() => setShowQuickCreate(false)}
            onTaskCreate={(task) => {
              onTaskCreate?.(task);
              setShowQuickCreate(false);
            }}
            initialDate={selectedDate || currentDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarMobile;