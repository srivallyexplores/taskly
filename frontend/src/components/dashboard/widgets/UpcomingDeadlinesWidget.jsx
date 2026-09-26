import React from 'react';
import { motion } from 'framer-motion';
import { DashboardWidget } from '../index';
import { 
  CalendarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  FireIcon 
} from '@heroicons/react/24/outline';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

const UpcomingDeadlinesWidget = ({ 
  tasks = [],
  loading = false,
  error = null 
}) => {
  // Sample data if none provided
  const sampleTasks = tasks.length > 0 ? tasks : [
    {
      id: 1,
      title: 'Complete project proposal',
      due: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      priority: 'high',
      status: 'in-progress'
    },
    {
      id: 2,
      title: 'Review team feedback',
      due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
      priority: 'medium',
      status: 'in-progress'
    },
    {
      id: 3,
      title: 'Update documentation',
      due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days
      priority: 'low',
      status: 'in-progress'
    },
    {
      id: 4,
      title: 'Client presentation',
      due: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
      priority: 'high',
      status: 'in-progress'
    },
  ];
  
  // Sort by due date and filter upcoming tasks
  const upcomingTasks = sampleTasks
    .filter(task => task.status !== 'completed' && new Date(task.due) > new Date())
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return {
          text: 'text-error-600 dark:text-error-400',
          bg: 'bg-error-100 dark:bg-error-900/20',
          icon: FireIcon,
        };
      case 'medium':
        return {
          text: 'text-warning-600 dark:text-warning-400',
          bg: 'bg-warning-100 dark:bg-warning-900/20',
          icon: ExclamationTriangleIcon,
        };
      case 'low':
        return {
          text: 'text-success-600 dark:text-success-400',
          bg: 'bg-success-100 dark:bg-success-900/20',
          icon: ClockIcon,
        };
      default:
        return {
          text: 'text-secondary-600 dark:text-secondary-400',
          bg: 'bg-secondary-100 dark:bg-secondary-800',
          icon: ClockIcon,
        };
    }
  };
  
  const getTimeUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    
    if (isToday(due)) {
      const hours = Math.ceil((due - now) / (1000 * 60 * 60));
      return hours <= 1 ? 'Due now' : `${hours}h left`;
    }
    
    if (isTomorrow(due)) {
      return 'Tomorrow';
    }
    
    const days = differenceInDays(due, now);
    return `${days} days`;
  };
  
  const getUrgencyLevel = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const hoursUntilDue = (due - now) / (1000 * 60 * 60);
    
    if (hoursUntilDue <= 2) return 'critical';
    if (hoursUntilDue <= 24) return 'urgent';
    if (hoursUntilDue <= 72) return 'soon';
    return 'normal';
  };
  
  return (
    <DashboardWidget
      title="Upcoming Deadlines"
      subtitle={`${upcomingTasks.length} tasks need attention`}
      size="md"
      loading={loading}
      error={error}
    >
      <div className="space-y-3">
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              No upcoming deadlines
            </p>
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          upcomingTasks.map((task, index) => {
            const priority = getPriorityColor(task.priority);
            const PriorityIcon = priority.icon;
            const urgency = getUrgencyLevel(task.due);
            const timeUntil = getTimeUntilDue(task.due);
            
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  urgency === 'critical' 
                    ? 'border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/10'
                    : urgency === 'urgent'
                    ? 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/10'
                    : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <div className={`w-6 h-6 rounded ${priority.bg} flex items-center justify-center mr-2 flex-shrink-0`}>
                        <PriorityIcon className={`w-3 h-3 ${priority.text}`} />
                      </div>
                      <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-400">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {format(new Date(task.due), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  
                  <div className="ml-3 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      urgency === 'critical'
                        ? 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300'
                        : urgency === 'urgent'
                        ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-300'
                        : urgency === 'soon'
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
                    }`}>
                      {timeUntil}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardWidget>
  );
};

export default UpcomingDeadlinesWidget;