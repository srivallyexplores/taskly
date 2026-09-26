import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format, startOfDay, endOfDay, isToday, isTomorrow, isYesterday } from 'date-fns';

import EnhancedTaskCard from './EnhancedTaskCard';
import TaskFilters from './TaskFilters';
import LoadingSpinner, { InlineSpinner } from '../common/LoadingSpinner';
import { SkeletonCard } from '../common/SkeletonLoader';
import ErrorMessage from '../common/ErrorMessage';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';
import { useTasks, useTaskOperations, useTaskFilters } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';

const EnhancedTaskList = ({ 
  userId = null, 
  showFilters = true, 
  showUser = false,
  className = '',
  onTaskEdit,
  onTaskDelete,
  initialFilters = {},
  calendarIntegration = true,
  viewMode = 'list', // 'list', 'calendar', 'compact'
  groupBy = 'none' // 'none', 'date', 'priority', 'status', 'project'
}) => {
  const { user } = useAuth();
  const { 
    currentView: calendarView, 
    selectedDate, 
    setSelectedDate,
    getFilteredTasks: getCalendarTasks,
    filters: calendarFilters,
    updateFilter: updateCalendarFilter
  } = useCalendar();
  
  const targetUserId = userId || user?.id || user?._id;
  
  const { filters, updateFilter, updateFilters, resetFilters, hasActiveFilters } = useTaskFilters(initialFilters);
  const { tasks, pagination, loading, error, fetchTasks, loadMoreTasks, refreshTasks, updateTaskParams } = useTasks(targetUserId, filters);
  const { updateTaskStatus, loading: operationLoading } = useTaskOperations();
  
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [sortBy, setSortBy] = useState(filters.sortBy || 'due');
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Sync with calendar filters when calendar integration is enabled
  useEffect(() => {
    if (calendarIntegration && calendarFilters) {
      updateFilters({
        ...filters,
        priority: calendarFilters.priority,
        status: calendarFilters.status,
        tags: calendarFilters.tags
      });
    }
  }, [calendarIntegration, calendarFilters]);

  // Update API params when filters change
  useEffect(() => {
    updateTaskParams({ ...filters, sortBy, sortOrder });
  }, [filters, sortBy, sortOrder, updateTaskParams]);

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply calendar date filter if calendar integration is active
    if (calendarIntegration && selectedDate && showCalendarView) {
      const startOfSelectedDay = startOfDay(selectedDate);
      const endOfSelectedDay = endOfDay(selectedDate);
      
      filtered = filtered.filter(task => {
        if (!task.due) return false;
        const taskDate = new Date(task.due);
        return taskDate >= startOfSelectedDay && taskDate <= endOfSelectedDay;
      });
    }

    return filtered;
  }, [tasks, searchQuery, calendarIntegration, selectedDate, showCalendarView]);

  // Group tasks based on groupBy setting
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': filteredTasks };
    }

    const groups = {};

    filteredTasks.forEach(task => {
      let groupKey;

      switch (groupBy) {
        case 'date':
          if (task.due) {
            const taskDate = new Date(task.due);
            if (isToday(taskDate)) {
              groupKey = 'Today';
            } else if (isTomorrow(taskDate)) {
              groupKey = 'Tomorrow';
            } else if (isYesterday(taskDate)) {
              groupKey = 'Yesterday';
            } else {
              groupKey = format(taskDate, 'EEEE, MMM d');
            }
          } else {
            groupKey = 'No Due Date';
          }
          break;

        case 'priority':
          groupKey = `${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority`;
          break;

        case 'status':
          groupKey = task.status === 'in-progress' ? 'In Progress' : 
                    task.status.charAt(0).toUpperCase() + task.status.slice(1);
          break;

        case 'project':
          groupKey = task.project?.name || 'No Project';
          break;

        default:
          groupKey = 'All Tasks';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort groups by priority for date grouping
    if (groupBy === 'date') {
      const sortedGroups = {};
      const groupOrder = ['Yesterday', 'Today', 'Tomorrow'];
      
      // Add priority groups first
      groupOrder.forEach(key => {
        if (groups[key]) {
          sortedGroups[key] = groups[key];
        }
      });
      
      // Add other groups
      Object.keys(groups)
        .filter(key => !groupOrder.includes(key))
        .sort()
        .forEach(key => {
          sortedGroups[key] = groups[key];
        });
      
      return sortedGroups;
    }

    return groups;
  }, [filteredTasks, groupBy]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (taskId, shouldComplete) => {
    try {
      const newStatus = shouldComplete ? 'completed' : 'in-progress';
      await updateTaskStatus(taskId, newStatus);
      refreshTasks();
    } catch (error) {
      //console.error('Failed to update task status:', error);
    }
  }, [updateTaskStatus, refreshTasks]);

  // Handle task edit
  const handleTaskEdit = useCallback((task) => {
    if (onTaskEdit) {
      onTaskEdit(task);
    }
  }, [onTaskEdit]);

  // Handle task delete
  const handleTaskDelete = useCallback((taskId, taskTitle) => {
    if (onTaskDelete) {
      onTaskDelete(taskId, taskTitle);
    }
  }, [onTaskDelete]);

  // Handle calendar date selection
  const handleDateSelect = useCallback((date) => {
    if (calendarIntegration) {
      setSelectedDate(date);
      setShowCalendarView(true);
    }
  }, [calendarIntegration, setSelectedDate]);

  // Handle view mode changes
  const handleViewModeChange = useCallback((newViewMode) => {
    if (newViewMode === 'calendar') {
      setShowCalendarView(true);
    } else {
      setShowCalendarView(false);
    }
  }, []);

  // Handle filter sync with calendar
  const handleFilterChange = useCallback((filterKey, value) => {
    updateFilter(filterKey, value);
    
    // Sync with calendar if integration is enabled
    if (calendarIntegration && updateCalendarFilter) {
      updateCalendarFilter(filterKey, value);
    }
  }, [updateFilter, calendarIntegration, updateCalendarFilter]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy, newSortOrder = 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  // Handle bulk selection
  const handleSelectTask = useCallback((taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task._id)));
    }
  }, [filteredTasks, selectedTasks.size]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination?.hasNextPage && !loading) {
      loadMoreTasks();
    }
  }, [pagination?.hasNextPage, loading, loadMoreTasks]);

  if (error && !tasks.length) {
    return (
      <div className={`enhanced-task-list-error ${className}`}>
        <ErrorMessage
          message={error}
          onRetry={fetchTasks}
          title="Failed to load tasks"
        />
      </div>
    );
  }

  return (
    <div className={`enhanced-task-list ${className}`}>
      {/* Header with view controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            Tasks
            {showCalendarView && selectedDate && (
              <span className="ml-2 text-sm font-normal text-secondary-600 dark:text-secondary-400">
                for {dateUtils.formatDisplayDate(selectedDate)}
              </span>
            )}
          </h2>
          
          {/* Task count */}
          <div className="text-sm text-secondary-600 dark:text-secondary-400">
            {filteredTasks.length} of {pagination?.totalItems || tasks.length} tasks
            {hasActiveFilters() && ' (filtered)'}
          </div>
        </div>

        {/* View controls */}
        <div className="flex items-center space-x-2">
          {calendarIntegration && (
            <button
              onClick={() => handleViewModeChange(showCalendarView ? 'list' : 'calendar')}
              className={`p-2 rounded-lg transition-colors ${
                showCalendarView 
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700'
              }`}
              title={showCalendarView ? 'Show all tasks' : 'Show calendar tasks'}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center bg-secondary-100 dark:bg-secondary-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400'
              }`}
              title="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400'
              }`}
              title="Compact view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Group by selector */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500"
        >
          <option value="none">No Grouping</option>
          <option value="date">Group by Date</option>
          <option value="priority">Group by Priority</option>
          <option value="status">Group by Status</option>
          <option value="project">Group by Project</option>
        </select>

        {/* Filters toggle */}
        {showFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              hasActiveFilters()
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700'
            }`}
            title="Toggle filters"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <TaskFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onResetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters()}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </div>
      )}

      {/* Calendar date selector */}
      {calendarIntegration && showCalendarView && (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-primary-900 dark:text-primary-100">
                Calendar View Active
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Showing tasks for {selectedDate ? dateUtils.formatDisplayDate(selectedDate) : 'selected date'}
              </p>
            </div>
            <button
              onClick={() => setShowCalendarView(false)}
              className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Show All Tasks
            </button>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                onChange={handleSelectAll}
                className="rounded border-secondary-300 dark:border-secondary-600"
              />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">
                Select All
              </span>
            </label>
            {selectedTasks.size > 0 && (
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                {selectedTasks.size} selected
              </span>
            )}
          </div>
        </div>
      )}

      {/* Task content */}
      {loading && !tasks.length ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard 
              key={index} 
              hasAvatar={showUser}
              lines={2}
              className="h-24"
            />
          ))}
        </div>
      ) : (
        <>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 text-secondary-300 dark:text-secondary-600">
                <ListBulletIcon className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                No tasks found
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                {searchQuery ? 'Try adjusting your search query.' :
                 hasActiveFilters() ? 'Try adjusting your filters.' :
                 showCalendarView ? 'No tasks scheduled for this date.' :
                 'Create your first task to get started!'}
              </p>
              {(hasActiveFilters() || searchQuery) && (
                <button 
                  onClick={() => {
                    resetFilters();
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                <motion.div
                  key={groupName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {groupBy !== 'none' && (
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                        {groupName}
                      </h3>
                      <span className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 text-sm rounded-full">
                        {groupTasks.length}
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {groupTasks.map((task) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center space-x-3"
                        >
                          {selectedTasks.size > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(task._id)}
                              onChange={() => handleSelectTask(task._id)}
                              className="rounded border-secondary-300 dark:border-secondary-600"
                            />
                          )}
                          <div className="flex-1">
                            <EnhancedTaskCard
                              task={task}
                              onToggleComplete={handleToggleComplete}
                              onEdit={handleTaskEdit}
                              onDelete={handleTaskDelete}
                              showUser={showUser}
                              viewMode={viewMode}
                              size={viewMode === 'compact' ? 'sm' : 'md'}
                              isDraggable={calendarIntegration}
                              className={operationLoading ? 'opacity-50' : ''}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Load more */}
          {pagination?.hasNextPage && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                {loading ? (
                  <>
                    <InlineSpinner size="small" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More ({pagination.totalItems - tasks.length} remaining)</span>
                )}
              </button>
            </div>
          )}

          {/* Error footer */}
          {error && tasks.length > 0 && (
            <div className="mt-6">
              <ErrorMessage
                message={error}
                onRetry={fetchTasks}
                title="Failed to load more tasks"
                className="text-center"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedTaskList;