import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  FlagIcon,
  TagIcon,
  UserIcon,
  ArrowRightIcon,
  SparklesIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';

const CalendarSearch = ({
  onTaskSelect,
  onDateNavigate,
  placeholder = "Search tasks, dates, or use smart queries...",
  className = ''
}) => {
  const {
    allTasks,
    setCurrentDate,
    setSelectedDate,
    setView,
    updateFilter
  } = useCalendar();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);

  // Smart search patterns
  const smartPatterns = [
    {
      pattern: /^today$/i,
      description: 'Show today\'s tasks',
      action: () => navigateToToday()
    },
    {
      pattern: /^tomorrow$/i,
      description: 'Show tomorrow\'s tasks',
      action: () => navigateToTomorrow()
    },
    {
      pattern: /^overdue$/i,
      description: 'Show overdue tasks',
      action: () => filterOverdue()
    },
    {
      pattern: /^high priority$/i,
      description: 'Show high priority tasks',
      action: () => filterByPriority('high')
    },
    {
      pattern: /^completed$/i,
      description: 'Show completed tasks',
      action: () => filterByStatus('completed')
    },
    {
      pattern: /^#(\w+)$/i,
      description: 'Search by tag',
      action: (match) => filterByTag(match[1])
    },
    {
      pattern: /^@(\w+)$/i,
      description: 'Search by assignee',
      action: (match) => filterByAssignee(match[1])
    },
    {
      pattern: /^(\d{4}-\d{2}-\d{2})$/,
      description: 'Navigate to specific date',
      action: (match) => navigateToDate(match[1])
    },
    {
      pattern: /^next week$/i,
      description: 'Navigate to next week',
      action: () => navigateToNextWeek()
    },
    {
      pattern: /^last week$/i,
      description: 'Navigate to last week',
      action: () => navigateToLastWeek()
    }
  ];

  // Search results with different categories
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        tasks: [],
        smartActions: [],
        suggestions: getSuggestions()
      };
    }

    const lowerQuery = query.toLowerCase();
    
    // Task search
    const matchingTasks = allTasks.filter(task => {
      return (
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery) ||
        task.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        task.project?.name?.toLowerCase().includes(lowerQuery) ||
        task.assignee?.fullname?.toLowerCase().includes(lowerQuery) ||
        task.assignee?.username?.toLowerCase().includes(lowerQuery)
      );
    }).slice(0, 8);

    // Smart action matching
    const matchingActions = smartPatterns.filter(pattern => {
      if (pattern.pattern.test(query)) {
        return true;
      }
      return pattern.description.toLowerCase().includes(lowerQuery);
    }).slice(0, 3);

    // Date suggestions
    const dateSuggestions = getDateSuggestions(query);

    return {
      tasks: matchingTasks,
      smartActions: matchingActions,
      dateSuggestions,
      suggestions: []
    };
  }, [query, allTasks]);

  // Handle search input
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(0);
    setIsOpen(value.length > 0);
  }, []);

  // Handle search submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    // Check for smart patterns first
    for (const pattern of smartPatterns) {
      const match = query.match(pattern.pattern);
      if (match) {
        pattern.action(match);
        addToHistory(query);
        setQuery('');
        setIsOpen(false);
        return;
      }
    }

    // If no smart pattern matches, perform regular search
    if (searchResults.tasks.length > 0) {
      handleTaskSelect(searchResults.tasks[0]);
    }
  }, [query, searchResults.tasks]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    const totalResults = searchResults.tasks.length + 
                        searchResults.smartActions.length + 
                        (searchResults.dateSuggestions?.length || 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalResults);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelectResult(selectedIndex);
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  }, [isOpen, searchResults, selectedIndex]);

  // Handle result selection
  const handleSelectResult = useCallback((index) => {
    let currentIndex = 0;

    // Check tasks
    if (index < searchResults.tasks.length) {
      handleTaskSelect(searchResults.tasks[index]);
      return;
    }
    currentIndex += searchResults.tasks.length;

    // Check smart actions
    if (index < currentIndex + searchResults.smartActions.length) {
      const actionIndex = index - currentIndex;
      const action = searchResults.smartActions[actionIndex];
      const match = query.match(action.pattern);
      action.action(match);
      addToHistory(query);
      setQuery('');
      setIsOpen(false);
      return;
    }
    currentIndex += searchResults.smartActions.length;

    // Check date suggestions
    if (searchResults.dateSuggestions && index < currentIndex + searchResults.dateSuggestions.length) {
      const dateIndex = index - currentIndex;
      const dateStr = searchResults.dateSuggestions[dateIndex];
      navigateToDate(dateStr);
      return;
    }
  }, [searchResults, query]);

  // Task selection handler
  const handleTaskSelect = useCallback((task) => {
    if (onTaskSelect) {
      onTaskSelect(task);
    }
    
    // Navigate to task date
    if (task.due) {
      const taskDate = new Date(task.due);
      setCurrentDate(taskDate);
      setSelectedDate(taskDate);
    }
    
    addToHistory(query);
    setQuery('');
    setIsOpen(false);
  }, [onTaskSelect, setCurrentDate, setSelectedDate, query]);

  // Navigation helpers
  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setView('day');
    if (onDateNavigate) onDateNavigate(today);
  };

  const navigateToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentDate(tomorrow);
    setSelectedDate(tomorrow);
    setView('day');
    if (onDateNavigate) onDateNavigate(tomorrow);
  };

  const navigateToDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      setCurrentDate(date);
      setSelectedDate(date);
      setView('day');
      if (onDateNavigate) onDateNavigate(date);
    } catch (error) {
      //console.error('Invalid date:', dateStr);
    }
  };

  const navigateToNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentDate(nextWeek);
    setView('week');
    if (onDateNavigate) onDateNavigate(nextWeek);
  };

  const navigateToLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    setCurrentDate(lastWeek);
    setView('week');
    if (onDateNavigate) onDateNavigate(lastWeek);
  };

  // Filter helpers
  const filterOverdue = () => {
    updateFilter('status', ['in-progress']);
    // Additional logic to show only overdue tasks
  };

  const filterByPriority = (priority) => {
    updateFilter('priority', [priority]);
  };

  const filterByStatus = (status) => {
    updateFilter('status', [status]);
  };

  const filterByTag = (tag) => {
    updateFilter('tags', [tag]);
  };

  const filterByAssignee = (assignee) => {
    // Implementation for assignee filtering
  };

  // Get search suggestions
  const getSuggestions = () => [
    { text: 'today', description: 'View today\'s tasks' },
    { text: 'overdue', description: 'Show overdue tasks' },
    { text: 'high priority', description: 'Filter by high priority' },
    { text: '#work', description: 'Search by tag' },
    { text: '@john', description: 'Search by assignee' }
  ];

  // Get date suggestions based on query
  const getDateSuggestions = (query) => {
    const suggestions = [];
    const today = new Date();
    
    if (query.match(/^\d{1,2}$/)) {
      // Day of month
      const day = parseInt(query);
      if (day >= 1 && day <= 31) {
        const date = new Date(today.getFullYear(), today.getMonth(), day);
        suggestions.push(dateUtils.formatCalendarDate(date));
      }
    }
    
    return suggestions;
  };

  // Add to search history
  const addToHistory = (searchQuery) => {
    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(item => item !== searchQuery)];
      return newHistory.slice(0, 10); // Keep last 10 searches
    });
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(0);
  };

  return (
    <div className={`calendar-search relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(query.length > 0)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 border border-secondary-300 dark:border-secondary-600 rounded-xl bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-700 z-50 max-h-96 overflow-y-auto"
          >
            {/* Smart Actions */}
            {searchResults.smartActions.length > 0 && (
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                    Smart Actions
                  </span>
                </div>
                {searchResults.smartActions.map((action, index) => (
                  <SearchResultItem
                    key={`action-${action.description}-${index}`}
                    icon={<LightBulbIcon className="w-4 h-4" />}
                    title={action.description}
                    subtitle={`Try: "${query}"`}
                    isSelected={selectedIndex === index}
                    onClick={() => handleSelectResult(index)}
                    variant="action"
                  />
                ))}
              </div>
            )}

            {/* Tasks */}
            {searchResults.tasks.length > 0 && (
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-2 mb-2">
                  <ClockIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                    Tasks
                  </span>
                </div>
                {searchResults.tasks.map((task, index) => {
                  const resultIndex = searchResults.smartActions.length + index;
                  return (
                    <SearchResultItem
                      key={task._id}
                      icon={<ClockIcon className="w-4 h-4" />}
                      title={task.title}
                      subtitle={`${task.priority} priority • ${dateUtils.formatDisplayDate(task.due)}`}
                      isSelected={selectedIndex === resultIndex}
                      onClick={() => handleSelectResult(resultIndex)}
                      variant="task"
                      priority={task.priority}
                      status={task.status}
                    />
                  );
                })}
              </div>
            )}

            {/* Date Suggestions */}
            {searchResults.dateSuggestions && searchResults.dateSuggestions.length > 0 && (
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                    Dates
                  </span>
                </div>
                {searchResults.dateSuggestions.map((dateStr, index) => {
                  const resultIndex = searchResults.smartActions.length + searchResults.tasks.length + index;
                  return (
                    <SearchResultItem
                      key={`date-${dateStr}`}
                      icon={<CalendarIcon className="w-4 h-4" />}
                      title={dateUtils.formatDisplayDate(new Date(dateStr))}
                      subtitle="Navigate to this date"
                      isSelected={selectedIndex === resultIndex}
                      onClick={() => handleSelectResult(resultIndex)}
                      variant="date"
                    />
                  );
                })}
              </div>
            )}

            {/* Suggestions */}
            {searchResults.suggestions.length > 0 && (
              <div className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <LightBulbIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
                    Suggestions
                  </span>
                </div>
                {searchResults.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion.text)}
                    className="w-full text-left p-2 hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                  >
                    <div className="text-sm text-secondary-900 dark:text-secondary-100">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400">
                      {suggestion.description}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {query && searchResults.tasks.length === 0 && searchResults.smartActions.length === 0 && (
              <div className="p-6 text-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  No results found for "{query}"
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                  Try searching for tasks, dates, or use smart queries like "today" or "overdue"
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Search Result Item Component
const SearchResultItem = ({ 
  icon, 
  title, 
  subtitle, 
  isSelected, 
  onClick, 
  variant = 'default',
  priority,
  status 
}) => {
  const getVariantClasses = () => {
    const variants = {
      task: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      action: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
      date: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      default: 'hover:bg-secondary-50 dark:hover:bg-secondary-700'
    };
    return variants[variant];
  };

  const getPriorityColor = () => {
    if (variant !== 'task' || !priority) return 'text-secondary-500';
    
    const colors = {
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    };
    return colors[priority] || 'text-secondary-500';
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center space-x-3
        ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30' : getVariantClasses()}
      `}
      whileHover={{ x: 4 }}
    >
      <div className={`flex-shrink-0 ${getPriorityColor()}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">
            {subtitle}
          </div>
        )}
      </div>
      {isSelected && (
        <ArrowRightIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
      )}
    </motion.button>
  );
};

export default CalendarSearch;