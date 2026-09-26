import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  Cog6ToothIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import TeamNotifications from './TeamNotifications';
import LoadingSpinner from '../common/LoadingSpinner';
import SearchInput from '../common/SearchInput';
import FilterDropdown from '../common/FilterDropdown';
import { formatDistanceToNow, format } from 'date-fns';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotificationSettings,
    notificationSettings
  } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Fetch notifications on mount
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Filter and sort notifications
  const processedNotifications = React.useMemo(() => {
    let result = notifications || [];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(notification =>
        notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.data?.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.actor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filter) {
      case 'unread':
        result = result.filter(n => !n.read);
        break;
      case 'mentions':
        result = result.filter(n => n.type === 'mention');
        break;
      case 'assignments':
        result = result.filter(n => n.type === 'task_assigned');
        break;
      case 'comments':
        result = result.filter(n => n.type === 'comment_added');
        break;
      case 'deadlines':
        result = result.filter(n => n.type === 'deadline_approaching');
        break;
      default:
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'unread':
          if (a.read === b.read) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return a.read ? 1 : -1;
        default:
          return 0;
      }
    });

    return result;
  }, [notifications, searchTerm, filter, sortBy]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to relevant page based on notification type
    // This would be implemented based on your routing structure
    onClose();
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkAction = (action) => {
    switch (action) {
      case 'markRead':
        selectedNotifications.forEach(id => markAsRead(id));
        break;
      case 'delete':
        selectedNotifications.forEach(id => deleteNotification(id));
        break;
    }
    setSelectedNotifications([]);
  };

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread' },
    { value: 'mentions', label: 'Mentions' },
    { value: 'assignments', label: 'Assignments' },
    { value: 'comments', label: 'Comments' },
    { value: 'deadlines', label: 'Deadlines' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'unread', label: 'Unread First' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-secondary-900 shadow-xl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-3">
              <BellIcon className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              <div>
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                  Notifications
                </h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  {unreadCount} unread
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800"
              >
                ×
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800"
              >
                <div className="p-4 space-y-4">
                  <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                    Notification Settings
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.emailNotifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        className="rounded border-secondary-300 dark:border-secondary-600"
                      />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Email notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.pushNotifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked
                        })}
                        className="rounded border-secondary-300 dark:border-secondary-600"
                      />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Push notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.mentionNotifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          mentionNotifications: e.target.checked
                        })}
                        className="rounded border-secondary-300 dark:border-secondary-600"
                      />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Mention notifications
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.assignmentNotifications}
                        onChange={(e) => updateNotificationSettings({
                          ...notificationSettings,
                          assignmentNotifications: e.target.checked
                        })}
                        className="rounded border-secondary-300 dark:border-secondary-600"
                      />
                      <span className="text-sm text-secondary-700 dark:text-secondary-300">
                        Assignment notifications
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 space-y-4">
            {/* Search and Filters */}
            <div className="flex space-x-3">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  icon={MagnifyingGlassIcon}
                />
              </div>
              
              <FilterDropdown
                label="Filter"
                value={filter}
                options={filterOptions}
                onChange={setFilter}
                icon={FunnelIcon}
              />
              
              <FilterDropdown
                label="Sort"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
              />
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedNotifications.length > 0 && (
                  <>
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      {selectedNotifications.length} selected
                    </span>
                    <button
                      onClick={() => handleBulkAction('markRead')}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" />
              </div>
            ) : processedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-secondary-500 dark:text-secondary-400">
                <BellIcon className="w-12 h-12 mb-2 opacity-50" />
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {processedNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 cursor-pointer transition-colors ${
                      !notification.read 
                        ? 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20' 
                        : 'hover:bg-secondary-50 dark:hover:bg-secondary-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={() => handleSelectNotification(notification._id)}
                        className="mt-1 rounded border-secondary-300 dark:border-secondary-600"
                      />
                      
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm ${
                              !notification.read 
                                ? 'font-medium text-secondary-900 dark:text-secondary-100' 
                                : 'text-secondary-700 dark:text-secondary-300'
                            }`}>
                              {notification.message}
                            </p>
                            
                            {notification.data?.description && (
                              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                                {notification.data.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-2 mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt))} ago
                              </span>
                              <span>•</span>
                              <span>{format(new Date(notification.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                          </div>
                          
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className="p-1 text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationCenter;