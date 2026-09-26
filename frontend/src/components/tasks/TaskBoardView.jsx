import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon,
  FlagIcon,
  CalendarIcon,
  TagIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

const TaskBoardView = ({ 
  tasks = [], 
  onTaskMove, 
  onTaskEdit, 
  onTaskDelete,
  loading = false 
}) => {
  const [draggedTask, setDraggedTask] = useState(null);
  
  const columns = [
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/10',
      borderColor: 'border-primary-200 dark:border-primary-800',
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-success-500',
      bgColor: 'bg-success-50 dark:bg-success-900/10',
      borderColor: 'border-success-200 dark:border-success-800',
    },
    {
      id: 'failed',
      title: 'Failed',
      color: 'bg-error-500',
      bgColor: 'bg-error-50 dark:bg-error-900/10',
      borderColor: 'border-error-200 dark:border-error-800',
    },
  ];
  
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-error-500';
      case 'medium':
        return 'border-l-warning-500';
      case 'low':
        return 'border-l-success-500';
      default:
        return 'border-l-secondary-300';
    }
  };
  
  const formatDueDate = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-error-600 dark:text-error-400' };
    if (diffDays === 0) return { text: 'Today', color: 'text-warning-600 dark:text-warning-400' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-primary-600 dark:text-primary-400' };
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-secondary-600 dark:text-secondary-400' };
    return { text: due.toLocaleDateString(), color: 'text-secondary-500 dark:text-secondary-400' };
  };
  
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      onTaskMove(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };
  
  const TaskCard = ({ task }) => {
    const dueDate = formatDueDate(task.due);
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2, shadow: "0 4px 12px rgba(0,0,0,0.1)" }}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        className={`
          bg-white dark:bg-secondary-800 rounded-lg p-4 border-l-4 cursor-move
          border border-secondary-200 dark:border-secondary-700
          hover:border-secondary-300 dark:hover:border-secondary-600
          transition-all duration-200 shadow-sm hover:shadow-md
          ${getPriorityColor(task.priority)}
        `}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 line-clamp-2">
            {task.title}
          </h3>
          <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors">
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </div>
        
        {task.description && (
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Task Meta */}
        <div className="space-y-2">
          {/* Due Date */}
          <div className="flex items-center">
            <CalendarIcon className="w-3 h-3 mr-1 text-secondary-400" />
            <span className={`text-xs font-medium ${dueDate.color}`}>
              {dueDate.text}
            </span>
          </div>
          
          {/* Priority */}
          <div className="flex items-center">
            <FlagIcon className={`w-3 h-3 mr-1 ${
              task.priority === 'high' ? 'text-error-500' :
              task.priority === 'medium' ? 'text-warning-500' :
              'text-success-500'
            }`} />
            <span className="text-xs text-secondary-600 dark:text-secondary-400 capitalize">
              {task.priority}
            </span>
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center">
              <TagIcon className="w-3 h-3 mr-1 text-secondary-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300"
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
      </motion.div>
    );
  };
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-24 mb-4"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-secondary-800 rounded-lg p-4 border border-secondary-200 dark:border-secondary-700 mb-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                    <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
                    <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div
            key={column.id}
            className={`rounded-lg border-2 border-dashed transition-all duration-200 ${
              draggedTask && draggedTask.status !== column.id
                ? `${column.borderColor} ${column.bgColor}`
                : 'border-transparent'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
                  <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                    {column.title}
                  </h3>
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                
                <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Tasks */}
              <div className="space-y-3 min-h-[200px]">
                <AnimatePresence>
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </AnimatePresence>
                
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <div className={`w-8 h-8 rounded-full ${column.color} opacity-20 mx-auto mb-2`}></div>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">
                        No {column.title.toLowerCase()} tasks
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoardView;