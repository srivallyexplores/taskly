import React from 'react';
import { ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { isRecurringTask, isRecurringInstance, getRecurringSummary } from '../../utils/recurringTaskUtils';

const RecurringTaskIndicator = ({ 
  task, 
  showTooltip = true, 
  size = 'sm', 
  className = '' 
}) => {
  if (!isRecurringTask(task) && !isRecurringInstance(task)) {
    return null;
  }

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size] || sizeClasses.sm;

  const getIndicatorContent = () => {
    if (isRecurringTask(task)) {
      return {
        icon: ArrowPathIcon,
        title: 'Recurring Task',
        description: getRecurringSummary(task.recurring),
        color: 'text-blue-600 dark:text-blue-400'
      };
    } else if (isRecurringInstance(task)) {
      return {
        icon: ArrowPathIcon,
        title: 'Recurring Instance',
        description: `Instance ${task.instanceNumber + 1} of recurring task`,
        color: 'text-blue-500 dark:text-blue-400'
      };
    }
    
    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  const { icon: Icon, title, description, color } = content;

  const indicator = (
    <div className={`recurring-task-indicator inline-flex items-center ${className}`}>
      <Icon className={`${iconSize} ${color}`} title={showTooltip ? title : undefined} />
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <div className="relative group">
      {indicator}
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-secondary-900 dark:bg-secondary-100 text-white dark:text-secondary-900 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
        <div className="font-medium">{title}</div>
        <div className="text-xs opacity-90 mt-1">{description}</div>
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-secondary-900 dark:border-t-secondary-100"></div>
      </div>
    </div>
  );
};

export default RecurringTaskIndicator;