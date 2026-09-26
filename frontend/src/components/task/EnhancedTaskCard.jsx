import React, { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  EllipsisHorizontalIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';
import { dateUtils } from '../../utils/dateUtils';

const EnhancedTaskCard = ({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onDragStart,
  onDragEnd,
  showUser = false,
  viewMode = 'list', // 'list', 'calendar', 'compact'
  size = 'md', // 'xs', 'sm', 'md', 'lg'
  isDraggable = true,
  showActions = true,
  className = '' 
}) => {
  const {
    _id,
    title,
    description,
    due,
    priority,
    status,
    tags = [],
    labels = [],
    user,
    createdAt,
    updatedAt,
    project,
    assignee,
    estimatedTime,
    actualTime
  } = task;

  const { currentView } = useCalendar();
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const dueDate = new Date(due);
  const isOverdue = isPast(dueDate) && status !== 'completed';
  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const isDueToday = dateUtils.isTaskDueToday(task);

  // Get appropriate styling based on view mode and size
  const getCardClasses = () => {
    const baseClasses = 'enhanced-task-card relative transition-all duration-200 rounded-lg border';
    
    const sizeClasses = {
      xs: 'p-2 text-xs',
      sm: 'p-3 text-sm',
      md: 'p-4 text-sm',
      lg: 'p-5 text-base'
    };

    const viewClasses = {
      list: 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 hover:shadow-md',
      calendar: `${taskCalendarUtils.getTaskColor(task)} text-white border-transparent hover:shadow-lg`,
      compact: 'bg-secondary-50 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800'
    };

    const statusClasses = {
      completed: 'opacity-75',
      failed: 'opacity-60 border-red-300 dark:border-red-600',
      'in-progress': isOverdue ? 'border-red-300 dark:border-red-600' : ''
    };

    return `
      ${baseClasses}
      ${sizeClasses[size]}
      ${viewClasses[viewMode]}
      ${statusClasses[status] || ''}
      ${isDragging ? 'scale-95 opacity-50' : ''}
      ${isDueToday && viewMode === 'list' ? 'ring-2 ring-primary-400' : ''}
      ${className}
    `.trim();
  };

  // Handle drag operations
  const handleDragStart = useCallback((event) => {
    if (!isDraggable) {
      event.preventDefault();
      return;
    }

    setIsDragging(true);
    
    // Set drag data
    event.dataTransfer.setData('text/plain', JSON.stringify({
      taskId: _id,
      originalDate: due,
      task: task
    }));
    
    event.dataTransfer.effectAllowed = 'move';
    
    if (onDragStart) {
      onDragStart(task, event);
    }
  }, [task, isDraggable, onDragStart, _id, due]);

  const handleDragEnd = useCallback((event) => {
    setIsDragging(false);
    
    if (onDragEnd) {
      onDragEnd(task, event);
    }
  }, [task, onDragEnd]);

  // Handle actions
  const handleToggleComplete = useCallback((event) => {
    event.stopPropagation();
    if (onToggleComplete && !isFailed) {
      onToggleComplete(_id, !isCompleted);
    }
  }, [onToggleComplete, isFailed, _id, isCompleted]);

  const handleEdit = useCallback((event) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(task);
    }
  }, [onEdit, task]);

  const handleDelete = useCallback((event) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(_id, title);
    }
  }, [onDelete, _id, title]);

  const handleCardClick = useCallback((event) => {
    if (viewMode === 'calendar') {
      handleEdit(event);
    }
  }, [viewMode, handleEdit]);

  // Render different layouts based on view mode
  const renderContent = () => {
    switch (viewMode) {
      case 'calendar':
        return renderCalendarContent();
      case 'compact':
        return renderCompactContent();
      default:
        return renderListContent();
    }
  };

  // Calendar view content (minimal, color-coded)
  const renderCalendarContent = () => (
    <div className="flex items-center justify-between min-w-0">
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isCompleted ? 'line-through opacity-75' : ''}`}>
          {taskCalendarUtils.getTaskDisplayText(task, size === 'xs' ? 8 : size === 'sm' ? 12 : 20)}
        </div>
        {size !== 'xs' && (
          <div className="flex items-center space-x-1 mt-1 text-xs opacity-90">
            <div className={`w-1.5 h-1.5 rounded-full ${
              priority === 'high' ? 'bg-red-200' : 
              priority === 'medium' ? 'bg-yellow-200' : 'bg-green-200'
            }`} />
            {due && (
              <span>{dateUtils.formatTimeSlot(due)}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex-shrink-0 ml-2">
        {isCompleted ? (
          <CheckCircleIcon className="w-4 h-4 text-green-200" />
        ) : isOverdue ? (
          <ExclamationTriangleIcon className="w-4 h-4 text-red-200" />
        ) : (
          <ClockIcon className="w-4 h-4 text-blue-200" />
        )}
      </div>
    </div>
  );

  // Compact view content
  const renderCompactContent = () => (
    <div className="flex items-center space-x-3">
      <button
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isCompleted 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-500'
        }`}
        onClick={handleToggleComplete}
        disabled={isFailed}
      >
        {isCompleted && <CheckCircleIcon className="w-3 h-3" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isCompleted ? 'line-through opacity-75' : ''}`}>
          {title}
        </div>
        <div className="flex items-center space-x-2 text-xs text-secondary-600 dark:text-secondary-400">
          <span className="capitalize">{priority}</span>
          <span>•</span>
          <span>{format(dueDate, 'MMM dd')}</span>
          {isOverdue && <span className="text-red-500">• Overdue</span>}
        </div>
      </div>

      {showActions && (
        <div className="flex items-center space-x-1">
          <button
            onClick={handleEdit}
            className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-secondary-400 hover:text-red-500 rounded"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  // Full list view content
  const renderListContent = () => (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <button
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-500'
            }`}
            onClick={handleToggleComplete}
            disabled={isFailed}
          >
            {isCompleted && <CheckCircleIcon className="w-4 h-4" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-secondary-900 dark:text-secondary-100 ${
              isCompleted ? 'line-through opacity-75' : ''
            }`}>
              {title}
            </h3>
            {description && size !== 'sm' && (
              <p className="text-secondary-600 dark:text-secondary-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center space-x-1 ml-3">
            {isDraggable && (
              <div className="p-1 text-secondary-400 cursor-grab active:cursor-grabbing">
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={handleEdit}
              className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-secondary-400 hover:text-red-500 rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {/* Priority */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {priority} priority
          </div>

          {/* Status */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {status === 'in-progress' ? 'In Progress' : status}
          </div>

          {/* Due date */}
          <div className={`flex items-center space-x-1 ${
            isOverdue ? 'text-red-600 dark:text-red-400' : 'text-secondary-600 dark:text-secondary-400'
          }`}>
            <CalendarIcon className="w-4 h-4" />
            <span>{format(dueDate, 'MMM dd, yyyy')}</span>
            {due && format(new Date(due), 'HH:mm') !== '00:00' && (
              <>
                <ClockIcon className="w-3 h-3 ml-1" />
                <span>{format(new Date(due), 'h:mm a')}</span>
              </>
            )}
          </div>
        </div>

        {/* Time tracking */}
        {(estimatedTime > 0 || actualTime > 0) && (
          <div className="text-xs text-secondary-500 dark:text-secondary-400">
            {estimatedTime > 0 && `Est: ${estimatedTime}m`}
            {actualTime > 0 && ` | Actual: ${actualTime}m`}
          </div>
        )}
      </div>

      {/* Tags and Labels */}
      {(tags.length > 0 || labels.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={`tag-${_id}-${tag}-${index}`}
              className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
          {labels.slice(0, 2).map((label, index) => (
            <span
              key={`label-${_id}-${label}-${index}`}
              className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 text-xs rounded-full"
            >
              {label}
            </span>
          ))}
          {(tags.length > 3 || labels.length > 2) && (
            <span className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400 text-xs rounded-full">
              +{Math.max(0, tags.length - 3) + Math.max(0, labels.length - 2)} more
            </span>
          )}
        </div>
      )}

      {/* Project and Assignee */}
      {(project || assignee || showUser) && (
        <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
          {project && (
            <div className="flex items-center space-x-1">
              <span>Project:</span>
              <span className="font-medium">{project.name}</span>
            </div>
          )}
          {assignee && (
            <div className="flex items-center space-x-1">
              <span>Assigned to:</span>
              <span className="font-medium">{assignee.fullname || assignee.username}</span>
            </div>
          )}
          {showUser && user && (
            <div className="flex items-center space-x-1">
              <span>Created by:</span>
              <span className="font-medium">{user.fullname || user.username}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {size !== 'sm' && (
        <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <span>Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</span>
          {updatedAt !== createdAt && (
            <span>Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      className={getCardClasses()}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
      whileHover={{ scale: viewMode === 'calendar' ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      layout
      title={viewMode === 'calendar' ? taskCalendarUtils.getTaskTooltipText(task) : undefined}
    >
      {renderContent()}

      {/* Drag indicator */}
      {isDraggable && isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-primary-400 bg-primary-50/50 dark:bg-primary-900/20 rounded-lg" />
      )}

      {/* Calendar view quick actions */}
      {viewMode === 'calendar' && showQuickActions && showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-2 -right-2 flex items-center space-x-1"
        >
          {!isCompleted && (
            <button
              onClick={handleToggleComplete}
              className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-sm"
              title="Mark as completed"
            >
              <CheckCircleIcon className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickActions(false);
            }}
            className="w-6 h-6 bg-secondary-600 hover:bg-secondary-700 text-white rounded-full flex items-center justify-center shadow-sm"
            title="More actions"
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnhancedTaskCard;