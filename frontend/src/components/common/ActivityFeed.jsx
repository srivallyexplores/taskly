import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlusIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import Avatar from './Avatar';

const ActivityFeed = ({ activities = [], className = '', showLoadMore = false, onLoadMore }) => {
  const getActivityIcon = (type) => {
    const iconClasses = "w-5 h-5";
    
    switch (type) {
      case 'user_joined':
      case 'member_added':
        return <UserPlusIcon className={`${iconClasses} text-green-600`} />;
      case 'task_created':
      case 'project_created':
        return <DocumentPlusIcon className={`${iconClasses} text-blue-600`} />;
      case 'task_completed':
        return <CheckCircleIcon className={`${iconClasses} text-green-600`} />;
      case 'task_updated':
      case 'project_updated':
        return <PencilIcon className={`${iconClasses} text-yellow-600`} />;
      case 'task_deleted':
      case 'project_deleted':
        return <TrashIcon className={`${iconClasses} text-red-600`} />;
      case 'comment_added':
        return <ChatBubbleLeftIcon className={`${iconClasses} text-purple-600`} />;
      default:
        return <DocumentPlusIcon className={`${iconClasses} text-gray-600`} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_joined':
      case 'member_added':
      case 'task_completed':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'task_created':
      case 'project_created':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'task_updated':
      case 'project_updated':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'task_deleted':
      case 'project_deleted':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'comment_added':
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          <DocumentPlusIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No activity yet</p>
          <p className="text-sm">Activity will appear here as team members interact with projects and tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {activities.map((activity, index) => (
        <div
          key={activity.id || index}
          className={`
            relative flex items-start space-x-3 p-4 rounded-lg border
            ${getActivityColor(activity.type)}
          `}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar
              src={activity.user?.avatar}
              alt={activity.user?.name}
              size="sm"
              fallback={activity.user?.name?.charAt(0)?.toUpperCase()}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {getActivityIcon(activity.type)}
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.user?.name || 'Unknown User'}
              </p>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {activity.description || activity.message}
            </p>
            
            {activity.details && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {activity.details}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {activity.timestamp ? (
              formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
            ) : (
              'Just now'
            )}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {showLoadMore && onLoadMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;