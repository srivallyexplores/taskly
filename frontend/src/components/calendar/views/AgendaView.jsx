import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../../context/CalendarContext';
import { dateUtils } from '../../../utils/dateUtils';
import { taskCalendarUtils } from '../../../utils/taskCalendarUtils';

const AgendaView = ({ 
  onTaskClick, 
  onTaskDrop,
  onCreateTask,
  daysToShow = 30 
}) => {
  const {
    currentDate,
    getFilteredTasks,
    settings
  } = useCalendar();

  const [expandedDates, setExpandedDates] = useState(new Set());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Generate date range for agenda
  const dateRange = useMemo(() => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  }, [currentDate, daysToShow]);

  // Group and filter tasks by date
  const groupedTasks = useMemo(() => {
    const allTasks = getFilteredTasks();
    const grouped = {};
    
    dateRange.forEach(date => {
      const dateKey = dateUtils.getDateKey(date);
      const dateTasks = dateUtils.getTasksForDate(allTasks, date);
      
      // Apply additional filters
      let filteredTasks = dateTasks;
      
      switch (selectedFilter) {
        case 'overdue':
          filteredTasks = dateTasks.filter(task => dateUtils.isTaskOverdue(task));
          break;
        case 'today':
          filteredTasks = dateUtils.isToday(date) ? dateTasks : [];
          break;
        case 'upcoming':
          filteredTasks = dateTasks.filter(task => !dateUtils.isTaskOverdue(task) && task.status !== 'completed');
          break;
        case 'completed':
          filteredTasks = dateTasks.filter(task => task.status === 'completed');
          break;
        default:
          filteredTasks = dateTasks;
      }
      
      // Sort tasks
      switch (sortBy) {
        case 'priority':
          filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          });
          break;
        case 'status':
          filteredTasks.sort((a, b) => {
            const statusOrder = { 'in-progress': 3, failed: 2, completed: 1 };
            return statusOrder[b.status] - statusOrder[a.status];
          });
          break;
        case 'title':
          filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          // Keep original order (by due date)
          break;
      }
      
      if (filteredTasks.length > 0) {
        grouped[dateKey] = {
          date,
          tasks: filteredTasks
        };
      }
    });
    
    return grouped;
  }, [dateRange, getFilteredTasks, selectedFilter, sortBy]);

  // Handle date expansion toggle
  const toggleDateExpansion = useCallback((dateKey) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  }, []);

  // Handle task click
  const handleTaskClick = useCallback((task, event) => {
    if (onTaskClick) {
      onTaskClick(task, event);
    }
  }, [onTaskClick]);

  // Handle create task for specific date
  const handleCreateTask = useCallback((date) => {
    if (onCreateTask) {
      onCreateTask(date);
    }
  }, [onCreateTask]);

  // Get agenda statistics
  const getAgendaStats = () => {
    const allTasks = Object.values(groupedTasks).flatMap(group => group.tasks);
    
    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      overdue: allTasks.filter(t => dateUtils.isTaskOverdue(t)).length,
      upcoming: allTasks.filter(t => !dateUtils.isTaskOverdue(t) && t.status !== 'completed').length
    };
  };

  const stats = getAgendaStats();

  return (
    <div className="agenda-view h-full flex flex-col">
      {/* Agenda header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              Agenda
            </h2>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Next {daysToShow} days • {stats.total} tasks
            </p>
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-4 h-4" />
              <span>{stats.completed}</span>
            </div>
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{stats.overdue}</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <ClockIcon className="w-4 h-4" />
              <span>{stats.upcoming}</span>
            </div>
          </div>
        </div>

        {/* Filters and sorting */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Filter:
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="all">All Tasks</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agenda content */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {Object.keys(groupedTasks).length === 0 ? (
          <EmptyAgenda filter={selectedFilter} onCreateTask={() => handleCreateTask(new Date())} />
        ) : (
          Object.entries(groupedTasks).map(([dateKey, group]) => (
            <DateGroup
              key={dateKey}
              dateKey={dateKey}
              date={group.date}
              tasks={group.tasks}
              isExpanded={expandedDates.has(dateKey)}
              onToggleExpansion={toggleDateExpansion}
              onTaskClick={handleTaskClick}
              onCreateTask={handleCreateTask}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Date group component
const DateGroup = ({ 
  dateKey, 
  date, 
  tasks, 
  isExpanded, 
  onToggleExpansion, 
  onTaskClick,
  onCreateTask 
}) => {
  const isToday = dateUtils.isToday(date);
  const isPast = dateUtils.isPast(date) && !isToday;
  const stats = taskCalendarUtils.getDateTaskStats(tasks, date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden"
    >
      {/* Date header */}
      <motion.button
        onClick={() => onToggleExpansion(dateKey)}
        className={`
          w-full p-4 flex items-center justify-between hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors
          ${isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
          ${isPast ? 'opacity-75' : ''}
        `}
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      >
        <div className="flex items-center space-x-3">
          {/* Expand/collapse icon */}
          {isExpanded ? (
            <ChevronDownIcon className="w-5 h-5 text-secondary-500" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-secondary-500" />
          )}
          
          {/* Date info */}
          <div className="text-left">
            <div className={`
              text-lg font-semibold
              ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-secondary-900 dark:text-secondary-100'}
            `}>
              {dateUtils.formatDisplayDate(date)}
              {isToday && <span className="ml-2 text-sm font-normal">(Today)</span>}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              {stats.completed > 0 && ` • ${stats.completed} completed`}
              {stats.overdue > 0 && ` • ${stats.overdue} overdue`}
            </div>
          </div>
        </div>

        {/* Task summary indicators */}
        <div className="flex items-center space-x-2">
          {stats.high > 0 && (
            <div className="w-3 h-3 bg-red-500 rounded-full" title={`${stats.high} high priority`} />
          )}
          {stats.medium > 0 && (
            <div className="w-3 h-3 bg-yellow-500 rounded-full" title={`${stats.medium} medium priority`} />
          )}
          {stats.low > 0 && (
            <div className="w-3 h-3 bg-green-500 rounded-full" title={`${stats.low} low priority`} />
          )}
          
          <CalendarDaysIcon className="w-5 h-5 text-secondary-400" />
        </div>
      </motion.button>

      {/* Expanded task list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-secondary-200 dark:border-secondary-700"
          >
            <div className="p-4 space-y-3">
              {tasks.map((task, index) => (
                <TaskItem
                  key={task._id || task.id}
                  task={task}
                  onClick={onTaskClick}
                  index={index}
                />
              ))}
              
              {/* Add task button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCreateTask(date)}
                className="w-full p-3 border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg text-secondary-600 dark:text-secondary-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                + Add task for {dateUtils.formatDisplayDate(date)}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Task item component
const TaskItem = ({ task, onClick, index }) => {
  const handleClick = useCallback((event) => {
    onClick(task, event);
  }, [task, onClick]);

  const isOverdue = dateUtils.isTaskOverdue(task);
  const isCompleted = task.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${isCompleted 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : isOverdue
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-secondary-50 dark:bg-secondary-700 border-secondary-200 dark:border-secondary-600'
        }
        hover:shadow-md hover:scale-[1.02]
      `}
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Task title */}
          <h4 className={`
            text-sm font-semibold mb-1
            ${isCompleted ? 'line-through text-secondary-500 dark:text-secondary-400' : 'text-secondary-900 dark:text-secondary-100'}
          `}>
            {task.title}
          </h4>
          
          {/* Task description */}
          {task.description && (
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          {/* Task metadata */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Priority */}
            <div className={`
              flex items-center space-x-1 px-2 py-1 rounded-full
              ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${task.priority === 'high' ? 'bg-red-500' :
                  task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}
              `} />
              <span className="capitalize font-medium">{task.priority}</span>
            </div>
            
            {/* Status */}
            <div className={`
              px-2 py-1 rounded-full font-medium
              ${task.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                task.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}
            `}>
              {task.status === 'in-progress' ? 'In Progress' : task.status}
            </div>
            
            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center space-x-1">
                {task.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-secondary-100 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-secondary-500 dark:text-secondary-400">
                    +{task.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status icon */}
        <div className="flex-shrink-0 ml-3">
          {isCompleted ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          ) : isOverdue ? (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          ) : (
            <ClockIcon className="w-5 h-5 text-blue-500" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Empty agenda component
const EmptyAgenda = ({ filter, onCreateTask }) => {
  const getEmptyMessage = () => {
    switch (filter) {
      case 'today':
        return 'No tasks scheduled for today';
      case 'overdue':
        return 'No overdue tasks';
      case 'upcoming':
        return 'No upcoming tasks';
      case 'completed':
        return 'No completed tasks';
      default:
        return 'No tasks in your agenda';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <CalendarDaysIcon className="w-16 h-16 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
        {getEmptyMessage()}
      </h3>
      <p className="text-secondary-600 dark:text-secondary-400 mb-6">
        {filter === 'all' 
          ? 'Create your first task to get started with your agenda.'
          : 'Try adjusting your filter or create a new task.'
        }
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateTask}
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
      >
        Create Task
      </motion.button>
    </motion.div>
  );
};

export default AgendaView;