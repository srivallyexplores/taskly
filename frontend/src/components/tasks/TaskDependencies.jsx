import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button, Input } from '../ui';

const TaskDependencies = ({ taskId, dependencies = [], onDependenciesChange }) => {
  const [showAddDependency, setShowAddDependency] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [dependencyType, setDependencyType] = useState('blocks'); // blocks, blocked-by
  
  // Sample available tasks (in real app, this would come from API)
  const sampleTasks = [
    {
      id: 'task-1',
      title: 'Design user interface mockups',
      status: 'completed',
      priority: 'high',
      project: 'Website Redesign',
      assignee: 'Sarah Chen'
    },
    {
      id: 'task-2',
      title: 'Set up development environment',
      status: 'in-progress',
      priority: 'medium',
      project: 'Website Redesign',
      assignee: 'User'
    },
    {
      id: 'task-3',
      title: 'Write API documentation',
      status: 'todo',
      priority: 'low',
      project: 'API Development',
      assignee: 'User'
    },
    {
      id: 'task-4',
      title: 'Conduct user research',
      status: 'completed',
      priority: 'high',
      project: 'User Experience',
      assignee: 'Emily Davis'
    },
    {
      id: 'task-5',
      title: 'Implement authentication system',
      status: 'in-progress',
      priority: 'high',
      project: 'Backend Development',
      assignee: 'Alex Wilson'
    }
  ];
  
  useEffect(() => {
    // Filter out current task and already added dependencies
    const filtered = sampleTasks.filter(task => 
      task.id !== taskId && 
      !dependencies.some(dep => dep.taskId === task.id) &&
      (searchQuery === '' || 
       task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.assignee.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setAvailableTasks(filtered);
  }, [taskId, dependencies, searchQuery]);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20';
      case 'in-progress':
        return 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20';
      case 'todo':
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700';
      default:
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error-600 dark:text-error-400';
      case 'medium':
        return 'text-warning-600 dark:text-warning-400';
      case 'low':
        return 'text-success-600 dark:text-success-400';
      default:
        return 'text-secondary-600 dark:text-secondary-400';
    }
  };
  
  const getDependencyIcon = (type, status) => {
    if (type === 'blocks') {
      return status === 'completed' ? CheckCircleIcon : ArrowRightIcon;
    } else {
      return status === 'completed' ? CheckCircleIcon : ArrowLeftIcon;
    }
  };
  
  const getDependencyStatus = (dependency) => {
    const task = sampleTasks.find(t => t.id === dependency.taskId);
    if (!task) return 'unknown';
    
    if (dependency.type === 'blocks') {
      return task.status === 'completed' ? 'satisfied' : 'blocking';
    } else {
      return task.status === 'completed' ? 'satisfied' : 'waiting';
    }
  };
  
  const addDependency = (task) => {
    const newDependency = {
      id: `dep-${Date.now()}`,
      taskId: task.id,
      type: dependencyType,
      createdAt: new Date().toISOString()
    };
    
    onDependenciesChange?.([...dependencies, newDependency]);
    setShowAddDependency(false);
    setSearchQuery('');
  };
  
  const removeDependency = (dependencyId) => {
    onDependenciesChange?.(dependencies.filter(dep => dep.id !== dependencyId));
  };
  
  const getBlockingTasks = () => {
    return dependencies.filter(dep => {
      const status = getDependencyStatus(dep);
      return status === 'blocking' || status === 'waiting';
    });
  };
  
  const blockingTasks = getBlockingTasks();
  
  return (
    <div className="space-y-4">
      {/* Header with warning if blocked */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Task Dependencies
          </h3>
          {blockingTasks.length > 0 && (
            <div className="flex items-center space-x-1 text-warning-600 dark:text-warning-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-xs font-medium">
                {blockingTasks.length} blocking
              </span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddDependency(true)}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Dependency
        </Button>
      </div>
      
      {/* Existing Dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          {dependencies.map((dependency) => {
            const task = sampleTasks.find(t => t.id === dependency.taskId);
            if (!task) return null;
            
            const status = getDependencyStatus(dependency);
            const Icon = getDependencyIcon(dependency.type, task.status);
            
            return (
              <motion.div
                key={dependency.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                  status === 'satisfied'
                    ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/10'
                    : status === 'blocking' || status === 'waiting'
                    ? 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/10'
                    : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  status === 'satisfied'
                    ? 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400'
                    : status === 'blocking' || status === 'waiting'
                    ? 'bg-warning-100 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400'
                    : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {task.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                    <span>{task.project}</span>
                    <span>{task.assignee}</span>
                    <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {dependency.type === 'blocks' ? 'This task blocks' : 'Blocked by'} the above task
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => removeDependency(dependency.id)}
                  className="p-1 text-secondary-400 hover:text-error-600 dark:hover:text-error-400 rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {/* Add Dependency Modal */}
      <AnimatePresence>
        {showAddDependency && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700">
              <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Add Dependency
                  </h3>
                  <button
                    onClick={() => setShowAddDependency(false)}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Dependency Type Selection */}
                <div className="mt-4">
                  <label className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2 block">
                    Dependency Type
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setDependencyType('blocks')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        dependencyType === 'blocks'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                      }`}
                    >
                      This task blocks
                    </button>
                    <button
                      onClick={() => setDependencyType('blocked-by')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        dependencyType === 'blocked-by'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                          : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                      }`}
                    >
                      Blocked by
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                </div>
                
                {/* Available Tasks */}
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableTasks.map((task) => (
                    <motion.button
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => addDependency(task)}
                      className="w-full text-left p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                          {task.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                        <span>{task.project}</span>
                        <span>{task.assignee}</span>
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                  
                  {availableTasks.length === 0 && (
                    <div className="text-center py-8">
                      <ClockIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        No tasks found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Empty State */}
      {dependencies.length === 0 && !showAddDependency && (
        <div className="text-center py-8 border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-lg">
          <ArrowRightIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            No dependencies set
          </p>
          <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
            Add dependencies to track task relationships
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskDependencies;