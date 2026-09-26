import React from 'react';
import { format, isSameDay, isToday, isPast } from 'date-fns';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';

const AgendaView = () => {
  const { tasks } = useCalendar();

  // Group tasks by date
  const groupedTasks = tasks.reduce((groups, task) => {
    if (task.due) {
      const dateKey = format(new Date(task.due), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(task);
    }
    return groups;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedTasks).sort();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-secondary-600 dark:text-secondary-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-secondary-400" />;
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-secondary-900 overflow-auto">
      <div className="max-w-4xl mx-auto p-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-500 dark:text-secondary-400">
              No upcoming tasks
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const date = new Date(dateKey);
              const dateTasks = groupedTasks[dateKey];
              const isTodayDate = isToday(date);
              const isOverdue = isPast(date) && !isTodayDate;

              return (
                <div key={dateKey} className="space-y-3">
                  {/* Date header */}
                  <div className="flex items-center space-x-3 pb-2 border-b border-secondary-200 dark:border-secondary-700">
                    <div
                      className={`
                        text-2xl font-bold
                        ${isTodayDate ? 'bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center' : 'text-secondary-900 dark:text-secondary-100'}
                      `}
                    >
                      {format(date, 'd')}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        {dateTasks.length} {dateTasks.length === 1 ? 'task' : 'tasks'}
                        {isOverdue && (
                          <span className="ml-2 text-red-600 dark:text-red-400">
                            • Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks for this date */}
                  <div className="space-y-2">
                    {dateTasks.map((task) => (
                      <div
                        key={task._id}
                        className="flex items-start space-x-3 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                      >
                        {/* Status icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(task.status)}
                        </div>

                        {/* Task content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-base font-medium text-secondary-900 dark:text-secondary-100">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {/* Priority badge */}
                              <span
                                className={`
                                  px-2 py-1 text-xs font-medium rounded-full
                                  ${getPriorityColor(task.priority)}
                                  bg-opacity-10
                                `}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {/* Task metadata */}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                            {task.due && (
                              <span>
                                {format(new Date(task.due), 'h:mm a')}
                              </span>
                            )}
                            {task.project && (
                              <span className="flex items-center">
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: task.project.color || '#6B7280' }}
                                />
                                {task.project.name}
                              </span>
                            )}
                            {task.tags && task.tags.length > 0 && (
                              <span>
                                {task.tags.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaView;
