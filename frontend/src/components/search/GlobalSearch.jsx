import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  TagIcon,
  FunnelIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { Button, Input } from '../ui';
import taskService from '../../services/taskService';
import userService from '../../services/userService';
import projectService from '../../services/projectService';

const GlobalSearch = ({ onClose, isOpen }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([
    'high priority tasks',
    'overdue items',
    'team projects',
    'completed this week'
  ]);
  const [searchFilters, setSearchFilters] = useState({
    type: 'all', // all, tasks, users, projects
    dateRange: '',
    priority: '',
    status: ''
  });
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Perform search across different data types
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = [];

      // Search tasks
      if (searchFilters.type === 'all' || searchFilters.type === 'tasks') {
        try {
          const taskResponse = await taskService.searchTasks(searchQuery);
          const tasks = taskResponse.data?.tasks || taskResponse.data || [];
          tasks.forEach(task => {
            searchResults.push({
              id: task._id || task.id,
              type: 'task',
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              tags: task.tags || [],
              user: task.user?.fullname || task.user?.username || 'Unknown',
              lastModified: new Date(task.updated_at || task.updatedAt).toLocaleDateString()
            });
          });
        } catch (err) {
          //console.error('Task search failed:', err);
        }
      }

      // Search users
      if (searchFilters.type === 'all' || searchFilters.type === 'users') {
        try {
          const userResponse = await userService.searchUsers(searchQuery);
          const users = userResponse.data?.users || userResponse.data || [];
          users.forEach(user => {
            searchResults.push({
              id: user._id || user.id,
              type: 'user',
              title: user.fullname || user.username,
              description: user.role || 'User',
              avatar: user.avatar,
              email: user.email,
              lastActive: new Date(user.last_login || user.lastLogin || user.updated_at).toLocaleDateString()
            });
          });
        } catch (err) {
          //console.error('User search failed:', err);
        }
      }

      // Search projects
      if (searchFilters.type === 'all' || searchFilters.type === 'projects') {
        try {
          const projectResponse = await projectService.searchProjects(searchQuery);
          const projects = projectResponse.data?.projects || projectResponse.data || [];
          projects.forEach(project => {
            searchResults.push({
              id: project._id || project.id,
              type: 'project',
              title: project.name,
              description: project.description,
              status: project.status,
              progress: project.progress,
              lastModified: new Date(project.updated_at || project.updatedAt).toLocaleDateString()
            });
          });
        } catch (err) {
          //console.error('Project search failed:', err);
        }
      }

      setResults(searchResults);
    } catch (err) {
      //console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const searchOperators = [
    { operator: 'is:', description: 'Filter by status', example: 'is:completed' },
    { operator: 'priority:', description: 'Filter by priority', example: 'priority:high' },
    { operator: 'assigned:', description: 'Filter by assignee', example: 'assigned:john' },
    { operator: 'tag:', description: 'Filter by tag', example: 'tag:urgent' },
    { operator: 'due:', description: 'Filter by due date', example: 'due:today' },
    { operator: 'created:', description: 'Filter by creation date', example: 'created:this-week' }
  ];
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (query.length > 2) {
      // Debounce search
      const timer = setTimeout(() => {
        performSearch(query);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query, searchFilters]);
  
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  const handleResultClick = (result) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(s => s !== query)].slice(0, 5);
      return updated;
    });
    
    // Handle navigation based on result type
    //console.log('Navigate to:', result);
    onClose();
  };
  
  const getResultIcon = (type) => {
    switch (type) {
      case 'task':
        return DocumentTextIcon;
      case 'user':
        return UserIcon;
      case 'project':
        return FunnelIcon;
      default:
        return DocumentTextIcon;
    }
  };
  
  const getResultColor = (type) => {
    switch (type) {
      case 'task':
        return 'text-primary-600 dark:text-primary-400';
      case 'user':
        return 'text-success-600 dark:text-success-400';
      case 'project':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-secondary-600 dark:text-secondary-400';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Search Modal */}
        <div className="flex min-h-full items-start justify-center p-4 pt-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl"
          >
            <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center p-4 border-b border-secondary-200 dark:border-secondary-700">
                <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tasks, users, projects... Try 'is:completed' or 'priority:high'"
                  className="flex-1 bg-transparent text-secondary-900 dark:text-secondary-100 placeholder-secondary-500 dark:placeholder-secondary-400 focus:outline-none text-lg"
                />
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 rounded">
                    ⌘K
                  </kbd>
                  <button
                    onClick={onClose}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Search Content */}
              <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
                {query.length === 0 ? (
                  <div className="p-6">
                    {/* Recent Searches */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2" />
                        Recent Searches
                      </h3>
                      <div className="space-y-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => setQuery(search)}
                            className="w-full text-left px-3 py-2 text-sm text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Search Operators */}
                    <div>
                      <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center">
                        <CommandLineIcon className="w-4 h-4 mr-2" />
                        Search Operators
                      </h3>
                      <div className="space-y-2">
                        {searchOperators.map((op, index) => (
                          <div key={index} className="flex items-center justify-between py-2">
                            <div>
                              <code className="text-sm font-mono text-primary-600 dark:text-primary-400">
                                {op.operator}
                              </code>
                              <span className="text-sm text-secondary-600 dark:text-secondary-400 ml-2">
                                {op.description}
                              </span>
                            </div>
                            <code className="text-xs text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 px-2 py-1 rounded">
                              {op.example}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-secondary-600 dark:text-secondary-400">Searching...</span>
                      </div>
                    ) : results.length > 0 ? (
                      <div className="space-y-1">
                        {results.map((result, index) => {
                          const Icon = getResultIcon(result.type);
                          const isSelected = index === selectedIndex;
                          
                          return (
                            <motion.button
                              key={result.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleResultClick(result)}
                              className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                                  : 'hover:bg-secondary-50 dark:hover:bg-secondary-700'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-700 flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-4 h-4 ${getResultColor(result.type)}`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                                      {result.title}
                                    </h4>
                                    <span className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                                      {result.type}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-1">
                                    {result.description}
                                  </p>
                                  
                                  {/* Result Meta */}
                                  <div className="flex items-center space-x-4 mt-2">
                                    {result.priority && (
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        result.priority === 'high' ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300' :
                                        result.priority === 'medium' ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300' :
                                        'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300'
                                      }`}>
                                        {result.priority}
                                      </span>
                                    )}
                                    
                                    {result.tags && (
                                      <div className="flex items-center space-x-1">
                                        <TagIcon className="w-3 h-3 text-secondary-400" />
                                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                                          {result.tags.join(', ')}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {result.lastModified && (
                                      <span className="text-xs text-secondary-500 dark:text-secondary-400">
                                        {result.lastModified}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MagnifyingGlassIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                        <p className="text-secondary-500 dark:text-secondary-400">
                          No results found for "{query}"
                        </p>
                        <p className="text-sm text-secondary-400 dark:text-secondary-500 mt-1">
                          Try different keywords or use search operators
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800">
                <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-secondary-200 dark:bg-secondary-700 rounded">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-secondary-200 dark:bg-secondary-700 rounded">↵</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-1.5 py-0.5 bg-secondary-200 dark:bg-secondary-700 rounded">esc</kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  <div>
                    {results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default GlobalSearch;