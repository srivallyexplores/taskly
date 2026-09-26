import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  BellIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onMarkAsRead, onDelete, onClick }) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'invitation_received':
        return <UserPlusIcon className="w-5 h-5 text-blue-500" />;
      case 'invitation_accepted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'invitation_denied':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'member_added':
      case 'member_removed':
        return <UserGroupIcon className="w-5 h-5 text-purple-500" />;
      case 'task_assigned':
      case 'task_completed':
        return <ClipboardDocumentCheckIcon className="w-5 h-5 text-orange-500" />;
      case 'project_created':
      case 'project_updated':
        return <FolderIcon className="w-5 h-5 text-indigo-500" />;
      case 'team_updated':
        return <UserGroupIcon className="w-5 h-5 text-teal-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-secondary-500" />;
    }
  };

  const handleClick = () => {
    // console.log('📬 NotificationItem: Notification clicked', {
    //   notificationId: notification._id,
    //   type: notification.type,
    //   read: notification.read,
    //   data: notification.data
    // });

    if (!notification.read && onMarkAsRead) {
      //console.log('📬 NotificationItem: Marking as read');
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type and data
    if (notification.data) {
      if (notification.data.invitationId) {
        //console.log('📬 NotificationItem: Navigating to /invitations');
        navigate('/invitations');
      } else if (notification.data.teamId) {
        //console.log(`📬 NotificationItem: Navigating to /teams/${notification.data.teamId}`);
        navigate(`/teams/${notification.data.teamId}`);
      } else if (notification.data.projectId) {
        //console.log(`📬 NotificationItem: Navigating to /projects/${notification.data.projectId}`);
        navigate(`/projects/${notification.data.projectId}`);
      } else if (notification.data.taskId) {
        //console.log('📬 NotificationItem: Navigating to /tasks');
        navigate(`/tasks`);
      } else {
        //console.log('📬 NotificationItem: No specific navigation data found');
      }
    } else {
      //console.log('📬 NotificationItem: No notification.data available');
    }

    if (onClick) {
      //console.log('📬 NotificationItem: Calling onClick callback');
      onClick(notification);
    }
  };

  const handleDelete = (e) => {
    //console.log('📬 NotificationItem: Delete clicked', notification._id);
    e.stopPropagation();
    if (onDelete) {
      onDelete(notification._id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={handleClick}
      className={`p-4 cursor-pointer transition-colors border-b border-secondary-200 dark:border-secondary-700 ${
        !notification.read
          ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20'
          : 'hover:bg-secondary-50 dark:hover:bg-secondary-800'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm ${
                !notification.read
                  ? 'font-semibold text-secondary-900 dark:text-secondary-100'
                  : 'text-secondary-700 dark:text-secondary-300'
              }`}>
                {notification.title}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">
                {notification.message}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-primary-500 rounded-full ml-2 mt-2 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="p-1 text-secondary-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
          title="Delete notification"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationItem;
