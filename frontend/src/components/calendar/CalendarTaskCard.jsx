import React from 'react';
import { format } from 'date-fns';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';

const CalendarTaskCard = ({ task, view = 'month' }) => {
  const { setDraggedTask, clearDraggedTask } = useCalendar();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-secondary-300 bg-secondary-50 dark:bg-secondary-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-3 h-3 text-green-600" />;
      case 'in-progress':
        return <ClockIcon className="w-3 h-3 text-blue-600" />;
      default:
        return null;
    }
  };

  const handleDragStart = (e) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
  };

  const handleDragEnd = () => {
    clearDraggedTask();
  };

  if (view === 'month') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          text-xs px-2 py-1 rounded border-l-2 cursor-move
          ${getPriorityColor(task.priority)}
          hover:shadow-sm transition-shadow
        `}
        title={task.title}
      >
        <div className="flex items-center space-x-1">
          {getStatusIcon(task.status)}
          <span className="truncate text-secondary-900 dark:text-secondary-100">
            {task.title}
          </span>
        </div>
      </div>
    );
  }

  if (view === 'week' || view === 'day') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          px-3 py-2 rounded-lg border-l-4 cursor-move mb-2
          ${getPriorityColor(task.priority)}
          hover:shadow-md transition-shadow
        `}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {task.title}
          </span>
          {getStatusIcon(task.status)}
        </div>
        {task.due && (
          <div className="text-xs text-secondary-600 dark:text-secondary-400">
            {format(new Date(task.due), 'h:mm a')}
          </div>
        )}
        {task.description && (
          <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
            {task.description}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CalendarTaskCard;
