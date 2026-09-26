import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  CalendarIcon,
  TagIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const TaskListView = ({ 
  tasks = [], 
  onTaskComplete, 
  onTaskEdit, 
  onTaskDelete,
  loading = false 
}) => {
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [expandedTask, setExpandedTask] = useState(null);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error-600 dark:text-error-400';
      case 'medium':
        return 'text-warning-600 dark:text-warning-400';
      case 'low':
        return 'text-success-600 dark:text-success-400';
      default:
        return 'text-secondary-500 dark:text-secondary-400';
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-300';
      case 'in-progress':
        return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300';
      case 'failed':
        return 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300';
      default:
        return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300';
    }
  };
  
  const formatDueDate = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return due.toLocaleDateString();
  };
  
  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };
  
  const toggleTaskExpansion = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };
  
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-secondary-800 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-4">
              <div className="w-5 h-5 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircleIcon className="w-16 h-16 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          No tasks found
        </h3>
        <p className="text-secondary-500 dark:text-secondary-400">
          Create your first task to get started with your productivity journey.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {tasks.map((task, index) => {
          const isSelected = selectedTasks.has(task.id);
          const isExpanded = expandedTask === task.id;
          const isOverdue = new Date(task.due) < new Date() && task.status !== 'completed';
          
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`
                bg-white dark:bg-secondary-800 rounded-lg border transition-all duration-200
                ${isSelected 
                  ? 'border-primary-300 dark:border-primary-600 shadow-md' 
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                }
                ${task.status === 'completed' ? 'opacity-75' : ''}
                ${isOverdue ? 'border-l-4 border-l-error-500' : ''}
              `}
            >
              <div className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTaskSelection(task.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {isSelected ? (
                      <CheckCircleIconSolid className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-secondary-300 dark:border-secondary-600 rounded-full hover:border-primary-400 transition-colors" />
                    )}
                  </button>
                  
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`text-sm font-medium cursor-pointer ${
                            task.status === 'completed' 
                              ? 'line-through text-secondary-500 dark:text-secondary-400' 
                              : 'text-secondary-900 dark:text-secondary-100'
                          }`}
                          onClick={() => toggleTaskExpansion(task.id)}
                        >
                          {task.title}
                        </h3>
                        
                        {task.description && (
                          <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        {/* Task Meta */}
                        <div className="flex items-center space-x-4 mt-2">
                          {/* Priority */}
                          <div className="flex items-center">
                            <FlagIcon className={`w-4 h-4 mr-1 ${getPriorityColor(task.priority)}`} />
                            <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          {/* Due Date */}
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1 text-secondary-400" />
                            <span className={`text-xs ${
                              isOverdue 
                                ? 'text-error-600 dark:text-error-400 font-medium' 
                                : 'text-secondary-500 dark:text-secondary-400'
                            }`}>
                              {formatDueDate(task.due)}
                            </span>
                          </div>
                          
                          {/* Status */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                          
                          {/* Tags */}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center">
                              <TagIcon className="w-4 h-4 mr-1 text-secondary-400" />
                              <div className="flex space-x-1">
                                {task.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 2 && (
                                  <span className="text-xs text-secondary-500 dark:text-secondary-400">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-4">
                        <button
                          onClick={() => onTaskComplete(task.id)}
                          className="p-1 text-secondary-400 hover:text-success-600 dark:hover:text-success-400 rounded transition-colors"
                          title="Mark as complete"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onTaskEdit(task.id)}
                          className="p-1 text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors"
                          title="Edit task"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onTaskDelete(task.id)}
                          className="p-1 text-secondary-400 hover:text-error-600 dark:hover:text-error-400 rounded transition-colors"
                          title="Delete task"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors">
                          <EllipsisHorizontalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-secondary-700 dark:text-secondary-300">Created:</span>
                          <span className="ml-2 text-secondary-600 dark:text-secondary-400">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-secondary-700 dark:text-secondary-300">Updated:</span>
                          <span className="ml-2 text-secondary-600 dark:text-secondary-400">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default TaskListView;