import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  FlagIcon,
  TagIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';

const CalendarFilters = ({
  onFilterChange,
  onClearFilters,
  className = ''
}) => {
  const {
    filters,
    updateFilter,
    clearFilters,
    allTasks,
    getFilteredTasks
  } = useCalendar();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get unique values for filter options
  const getUniqueValues = useCallback((field) => {
    const values = new Set();
    allTasks.forEach(task => {
      if (field === 'tags' && task.tags) {
        task.tags.forEach(tag => values.add(tag));
      } else if (field === 'assignee' && task.assignee) {
        values.add(`${task.assignee.fullname || task.assignee.username}:${task.assignee._id}`);
      } else if (field === 'project' && task.project) {
        values.add(`${task.project.name}:${task.project._id}`);
      } else if (task[field]) {
        values.add(task[field]);
      }
    });
    return Array.from(values).sort();
  }, [allTasks]);

  // Handle filter updates
  const handleFilterUpdate = useCallback((filterType, value) => {
    updateFilter(filterType, value);
    if (onFilterChange) {
      onFilterChange(filterType, value);
    }
  }, [updateFilter, onFilterChange]);

  // Handle search
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    // Implement search logic here if needed
  }, []);

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    clearFilters();
    setSearchQuery('');
    if (onClearFilters) {
      onClearFilters();
    }
  }, [clearFilters, onClearFilters]);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.priority.length > 0 || 
           filters.status.length > 0 || 
           filters.tags.length > 0 ||
           searchQuery.length > 0;
  };

  // Get filter counts
  const getFilterCounts = () => {
    const filteredTasks = getFilteredTasks();
    return {
      total: allTasks.length,
      filtered: filteredTasks.length,
      today: allTasks.filter(task => dateUtils.isTaskDueToday(task)).length,
      overdue: allTasks.filter(task => dateUtils.isTaskOverdue(task)).length,
      completed: allTasks.filter(task => task.status === 'completed').length
    };
  };

  const counts = getFilterCounts();

  return (
    <div className={`calendar-filters ${className}`}>
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
            ${hasActiveFilters() 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' 
              : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300'
            }
            hover:bg-primary-200 dark:hover:bg-primary-900/40
          `}
        >
          <FunnelIcon className="w-4 h-4" />
          <span className="font-medium">Filters</span>
          {hasActiveFilters() && (
            <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
              {filters.priority.length + filters.status.length + filters.tags.length}
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Quick Stats */}
        <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
          <div className="flex items-center space-x-1">
            <span>{counts.filtered}</span>
            <span>of</span>
            <span>{counts.total}</span>
            <span>tasks</span>
          </div>
          {counts.overdue > 0 && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{counts.overdue} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                  Search Tasks
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search by title, description, or tags..."
                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    label="Today"
                    count={counts.today}
                    active={false}
                    onClick={() => {/* Implement today filter */}}
                    icon={<CalendarDaysIcon className="w-3 h-3" />}
                  />
                  <FilterChip
                    label="Overdue"
                    count={counts.overdue}
                    active={false}
                    onClick={() => {/* Implement overdue filter */}}
                    icon={<ExclamationTriangleIcon className="w-3 h-3" />}
                    variant="danger"
                  />
                  <FilterChip
                    label="Completed"
                    count={counts.completed}
                    active={filters.status.includes('completed')}
                    onClick={() => {
                      const newStatus = filters.status.includes('completed')
                        ? filters.status.filter(s => s !== 'completed')
                        : [...filters.status, 'completed'];
                      handleFilterUpdate('status', newStatus);
                    }}
                    icon={<CheckCircleIcon className="w-3 h-3" />}
                    variant="success"
                  />
                </div>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <FlagIcon className="w-4 h-4 inline mr-1" />
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {['high', 'medium', 'low'].map(priority => (
                    <FilterChip
                      key={priority}
                      label={priority.charAt(0).toUpperCase() + priority.slice(1)}
                      active={filters.priority.includes(priority)}
                      onClick={() => {
                        const newPriority = filters.priority.includes(priority)
                          ? filters.priority.filter(p => p !== priority)
                          : [...filters.priority, priority];
                        handleFilterUpdate('priority', newPriority);
                      }}
                      variant={priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'success'}
                    />
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {['in-progress', 'completed', 'failed'].map(status => (
                    <FilterChip
                      key={status}
                      label={status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                      active={filters.status.includes(status)}
                      onClick={() => {
                        const newStatus = filters.status.includes(status)
                          ? filters.status.filter(s => s !== status)
                          : [...filters.status, status];
                        handleFilterUpdate('status', newStatus);
                      }}
                      variant={status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'primary'}
                    />
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {getUniqueValues('tags').slice(0, 20).map(tag => (
                    <FilterChip
                      key={tag}
                      label={`#${tag}`}
                      active={filters.tags.includes(tag)}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag];
                        handleFilterUpdate('tags', newTags);
                      }}
                      size="sm"
                    />
                  ))}
                  {getUniqueValues('tags').length > 20 && (
                    <span className="text-xs text-secondary-500 dark:text-secondary-400 px-2 py-1">
                      +{getUniqueValues('tags').length - 20} more
                    </span>
                  )}
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
                  <motion.div
                    animate={{ rotate: showAdvanced ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.div>
                </button>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 pt-4 border-t border-secondary-200 dark:border-secondary-700"
                  >
                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500"
                          placeholder="From"
                        />
                        <input
                          type="date"
                          className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500"
                          placeholder="To"
                        />
                      </div>
                    </div>

                    {/* Assignee Filter */}
                    {getUniqueValues('assignee').length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          <UserIcon className="w-4 h-4 inline mr-1" />
                          Assigned To
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('assignee').slice(0, 10).map(assigneeData => {
                            const [name, id] = assigneeData.split(':');
                            return (
                              <FilterChip
                                key={id}
                                label={name}
                                active={false}
                                onClick={() => {/* Implement assignee filter */}}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Project Filter */}
                    {getUniqueValues('project').length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Project
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {getUniqueValues('project').slice(0, 10).map(projectData => {
                            const [name, id] = projectData.split(':');
                            return (
                              <FilterChip
                                key={id}
                                label={name}
                                active={false}
                                onClick={() => {/* Implement project filter */}}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={handleClearAll}
                  disabled={!hasActiveFilters()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Clear All</span>
                </button>

                <div className="text-sm text-secondary-600 dark:text-secondary-400">
                  {hasActiveFilters() && (
                    <span>
                      Showing {counts.filtered} of {counts.total} tasks
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Filter Chip Component
const FilterChip = ({ 
  label, 
  active = false, 
  onClick, 
  count, 
  icon, 
  variant = 'primary',
  size = 'md' 
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: active 
        ? 'bg-primary-600 text-white border-primary-600' 
        : 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800',
      success: active 
        ? 'bg-green-600 text-white border-green-600' 
        : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      warning: active 
        ? 'bg-yellow-600 text-white border-yellow-600' 
        : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      danger: active 
        ? 'bg-red-600 text-white border-red-600' 
        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    return size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1 border rounded-full font-medium transition-all duration-200
        hover:shadow-sm active:scale-95
        ${getVariantClasses()}
        ${getSizeClasses()}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`
          px-1.5 py-0.5 rounded-full text-xs font-bold
          ${active ? 'bg-white/20' : 'bg-black/10 dark:bg-white/10'}
        `}>
          {count}
        </span>
      )}
    </motion.button>
  );
};

export default CalendarFilters;