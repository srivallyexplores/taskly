import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '../ui';
import { 
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FlagIcon,
  TagIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

const TaskFilters = ({ 
  filters, 
  onFiltersChange, 
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-success-500' },
    { value: 'medium', label: 'Medium', color: 'bg-warning-500' },
    { value: 'high', label: 'High', color: 'bg-error-500' },
  ];
  
  const statuses = [
    { value: 'in-progress', label: 'In Progress', icon: ClockIcon, color: 'text-primary-600' },
    { value: 'completed', label: 'Completed', icon: CheckCircleIcon, color: 'text-success-600' },
    { value: 'failed', label: 'Failed', icon: ExclamationTriangleIcon, color: 'text-error-600' },
  ];
  
  const categories = [
    'general', 'work', 'personal', 'health', 'learning', 'finance', 'travel', 'shopping'
  ];
  
  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'this-week', label: 'This Week' },
    { value: 'next-week', label: 'Next Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'overdue', label: 'Overdue' },
  ];
  
  const updateFilter = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };
  
  const toggleArrayFilter = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(key, newArray);
  };
  
  const clearFilters = () => {
    onFiltersChange({
      search: '',
      priorities: [],
      statuses: [],
      categories: [],
      dateRange: '',
      tags: [],
      assignee: '',
    });
  };
  
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
  };
  
  const handleSaveFilter = () => {
    if (saveFilterName.trim() && hasActiveFilters()) {
      onSaveFilter({
        name: saveFilterName.trim(),
        filters: { ...filters },
        createdAt: new Date().toISOString()
      });
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center space-x-3">
          <FunnelIcon className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
          <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            Filters
          </h3>
          {hasActiveFilters() && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              leftIcon={<XMarkIcon className="w-4 h-4" />}
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>
      
      {/* Quick Search */}
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
        <Input
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search tasks..."
          leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
        />
      </div>
      
      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorities.map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => toggleArrayFilter('priorities', priority.value)}
                      className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        (filters.priorities || []).includes(priority.value)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${priority.color} mr-2`} />
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.value}
                        onClick={() => toggleArrayFilter('statuses', status.value)}
                        className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                          (filters.statuses || []).includes(status.value)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mr-2 ${status.color}`} />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Due Date
                </label>
                <div className="flex flex-wrap gap-2">
                  {dateRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => updateFilter('dateRange', 
                        filters.dateRange === range.value ? '' : range.value
                      )}
                      className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        filters.dateRange === range.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                      }`}
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleArrayFilter('categories', category)}
                      className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 capitalize ${
                        (filters.categories || []).includes(category)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'border-secondary-300 dark:border-secondary-600 text-secondary-600 dark:text-secondary-400 hover:border-secondary-400'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Tags
                </label>
                <Input
                  value={filters.tagSearch || ''}
                  onChange={(e) => updateFilter('tagSearch', e.target.value)}
                  placeholder="Filter by tags..."
                  leftIcon={<TagIcon className="w-4 h-4" />}
                />
              </div>
            </div>
            
            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Saved Filters
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    leftIcon={<BookmarkIcon className="w-4 h-4" />}
                  >
                    Save Current
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((savedFilter) => (
                    <div key={savedFilter.id} className="flex items-center">
                      <button
                        onClick={() => onLoadFilter(savedFilter)}
                        className="flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-secondary-300 dark:border-secondary-600 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                      >
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                        {savedFilter.name}
                      </button>
                      <button
                        onClick={() => onDeleteFilter(savedFilter.id)}
                        className="px-2 py-2 rounded-r-lg border border-l-0 border-secondary-300 dark:border-secondary-600 text-secondary-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Save Filter Dialog */}
            <AnimatePresence>
              {showSaveDialog && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800"
                >
                  <div className="flex items-center space-x-3">
                    <Input
                      value={saveFilterName}
                      onChange={(e) => setSaveFilterName(e.target.value)}
                      placeholder="Filter name..."
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveFilter}
                      disabled={!saveFilterName.trim() || !hasActiveFilters()}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSaveDialog(false);
                        setSaveFilterName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskFilters;