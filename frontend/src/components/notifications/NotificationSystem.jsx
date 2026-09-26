import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';

const NotificationSystem = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    email: {
      taskReminders: true,
      dailyDigest: true,
      weeklyReport: true,
      teamUpdates: true,
      achievements: false
    },
    push: {
      taskReminders: true,
      mentions: true,
      deadlines: true,
      teamUpdates: false,
      achievements: true
    },
    inApp: {
      all: true,
      sound: true,
      desktop: true
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [emailAddress, setEmailAddress] = useState(user?.email || '');
  const [digestTime, setDigestTime] = useState('09:00');
  
  // Sample notifications
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'success',
        title: 'Task Completed',
        message: 'You completed "Design user interface" ahead of schedule!',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actions: [
          { label: 'View Task', action: 'view-task', taskId: 'task-1' }
        ]
      },
      {
        id: 2,
        type: 'warning',
        title: 'Deadline Approaching',
        message: 'Task "Project Review" is due in 2 hours',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        actions: [
          { label: 'View Task', action: 'view-task', taskId: 'task-2' },
          { label: 'Extend Deadline', action: 'extend-deadline', taskId: 'task-2' }
        ]
      },
      {
        id: 3,
        type: 'info',
        title: 'Team Update',
        message: 'Sarah Chen added you to the "Website Redesign" project',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true,
        actions: [
          { label: 'View Project', action: 'view-project', projectId: 'project-1' }
        ]
      },
      {
        id: 4,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: 'You earned the "Speed Demon" badge for completing 10 tasks in one day',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: true,
        actions: [
          { label: 'View Achievements', action: 'view-achievements' }
        ]
      }
    ];
    
    setNotifications(sampleNotifications);
  }, []);
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'error':
        return ExclamationTriangleIcon;
      case 'achievement':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };
  
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20';
      case 'warning':
        return 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/20';
      case 'error':
        return 'text-error-600 dark:text-error-400 bg-error-100 dark:bg-error-900/20';
      case 'achievement':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      default:
        return 'text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20';
    }
  };
  
  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };
  
  const dismissNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  const handleNotificationAction = (action, data) => {
    // Handle notification action
    // Handle different actions based on type
  };
  
  const updateSettings = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };
  
  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TaskFlow Test', {
        body: 'This is a test notification from TaskFlow',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      });
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-white" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Notifications
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`
                  relative p-4 rounded-lg border transition-all duration-200
                  ${notification.read 
                    ? 'border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-700/50' 
                    : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                          {notification.message}
                        </p>
                        
                        {/* Actions */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotificationAction(action.action, action)}
                                className="text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-secondary-500 dark:text-secondary-400">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatTimestamp(notification.timestamp)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="p-1"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="p-1 text-secondary-400 hover:text-error-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {notifications.length === 0 && (
          <div className="text-center py-8">
            <BellIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
            <p className="text-secondary-500 dark:text-secondary-400">
              No notifications yet
            </p>
            <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
              You'll see updates about your tasks and team here
            </p>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      {notifications.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            className="text-error-600 hover:text-error-700"
          >
            Clear All
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={sendTestNotification}
          >
            Test Notification
          </Button>
        </div>
      )}
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700"
          >
            <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Notification Settings
            </h4>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <EnvelopeIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Email Notifications
                  </h5>
                </div>
                
                <div className="space-y-3 ml-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Email Address</span>
                    <input
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                    />
                  </div>
                  
                  {Object.entries(settings.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSettings('email', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Daily Digest Time</span>
                    <input
                      type="time"
                      value={digestTime}
                      onChange={(e) => setDigestTime(e.target.value)}
                      className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                    />
                  </div>
                </div>
              </div>
              
              {/* Push Notifications */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Push Notifications
                  </h5>
                </div>
                
                <div className="space-y-3 ml-7">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">Browser Permission</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={requestNotificationPermission}
                      className="text-xs"
                    >
                      {Notification.permission === 'granted' ? 'Granted' : 'Request'}
                    </Button>
                  </div>
                  
                  {Object.entries(settings.push).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSettings('push', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* In-App Notifications */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <BellIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                  <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    In-App Notifications
                  </h5>
                </div>
                
                <div className="space-y-3 ml-7">
                  {Object.entries(settings.inApp).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-secondary-700 dark:text-secondary-300 capitalize">
                        {key === 'all' ? 'Show all notifications' : key}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSettings('inApp', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;