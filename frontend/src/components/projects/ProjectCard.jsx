import React from 'react';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const ProjectCard = ({ project, onClick, className = '' }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100 dark:bg-success-900/20';
      case 'completed':
        return 'text-info-600 bg-info-100 dark:bg-info-900/20';
      case 'on-hold':
        return 'text-warning-600 bg-warning-100 dark:bg-warning-900/20';
      case 'archived':
        return 'text-secondary-600 bg-secondary-100 dark:bg-secondary-800';
      default:
        return 'text-secondary-600 bg-secondary-100 dark:bg-secondary-800';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-success-500';
    if (progress >= 50) return 'bg-primary-500';
    if (progress >= 25) return 'bg-warning-500';
    return 'bg-secondary-400';
  };

  const memberCount = project.members?.length || 0;
  const taskCount = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
  const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onClick?.(project)}
      className={`bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-md hover:shadow-lg border border-secondary-200 dark:border-secondary-700 cursor-pointer transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
            <FolderIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate mb-1">
              {project.name}
            </h3>
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Progress
          </span>
          <span className="text-sm text-secondary-500 dark:text-secondary-400">
            {progress}%
          </span>
        </div>
        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-secondary-500 dark:text-secondary-400">
        <div className="flex items-center">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          <span>{completedTasks}/{taskCount} tasks</span>
        </div>
        <div className="flex items-center">
          <UsersIcon className="w-4 h-4 mr-1" />
          <span>{memberCount} members</span>
        </div>
      </div>

      {/* Due Date */}
      {project.dueDate && (
        <div className="flex items-center text-sm text-secondary-500 dark:text-secondary-400 mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
          <ClockIcon className="w-4 h-4 mr-1" />
          <span>Due {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}</span>
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;
