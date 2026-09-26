import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationIcon, ClockIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import { formatDistanceToNow } from 'date-fns';

const EnhancedTaskCard = ({ task, onSelect, onStatusChange }) => {
  const isOverdue = task.isOverdue && task.status !== 'completed';
  const daysUntilDue = Math.ceil((new Date(task.due) - new Date()) / (1000 * 60 * 60 * 24));

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in-progress':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect?.(task)}
      className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate mt-1">
              {task.description}
            </p>
          )}
        </div>

        {/* Status Badge */}
        <Badge
          variant={getStatusColor(task.status)}
          size="sm"
          className="ml-2 flex-shrink-0"
        >
          {task.status}
        </Badge>
      </div>

      {/* Tags and Labels */}
      {(task.tags?.length > 0 || task.labels?.length > 0) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded"
            >
              {tag}
            </span>
          ))}
          {task.labels?.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {/* Priority */}
          <Badge variant={getPriorityColor(task.priority)} size="xs">
            {task.priority}
          </Badge>

          {/* Overdue Indicator */}
          {isOverdue && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <ExclamationIcon className="w-4 h-4" />
              <span className="text-xs font-medium">Overdue</span>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center space-x-1 text-secondary-600 dark:text-secondary-400 text-xs">
            <ClockIcon className="w-4 h-4" />
            <span>
              {isOverdue
                ? `${Math.abs(daysUntilDue)} days ago`
                : `${daysUntilDue} days left`}
            </span>
          </div>
        </div>
      </div>

      {/* Assignee and Progress */}
      <div className="flex items-center justify-between">
        {/* Assignee */}
        {task.assignee && (
          <div className="flex items-center space-x-2">
            <Avatar
              src={task.assignee.avatar}
              name={task.assignee.fullname}
              size="xs"
            />
            <span className="text-xs text-secondary-600 dark:text-secondary-400">
              {task.assignee.fullname}
            </span>
          </div>
        )}

        {/* Progress (for subtasks) */}
        {task.subtasks?.length > 0 && (
          <div className="text-xs text-secondary-600 dark:text-secondary-400">
            {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
          </div>
        )}

        {/* Completion Status */}
        {task.status === 'completed' && (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Time Tracking */}
      {(task.estimatedTime || task.actualTime) && (
        <div className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700 text-xs text-secondary-600 dark:text-secondary-400">
          <div className="flex justify-between">
            <span>Est: {task.estimatedTime}m</span>
            <span>Actual: {task.actualTime}m</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EnhancedTaskCard;
