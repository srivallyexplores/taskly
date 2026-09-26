import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  Cog6ToothIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';
import { taskCalendarUtils } from '../../utils/taskCalendarUtils';

const CalendarNotifications = ({
  onNotificationClick,
  onSettingsClick,
  className = ''
}) => {
  const { allTasks, settings } = useCalendar();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Notification types
  const NOTIFICATION_TYPES = {
    DEADLINE_APPROACHING: 'deadline_approaching',
    OVERDUE: 'overdue',
    TASK_DUE_TODAY: 'task_due_today',
    REMINDER: 'reminder',
    TASK_COMPLETED: 'task_completed'
  };

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3'); // You'll need to add this file
    audioRef.current.volume = 0.5;
  }, []);

  // Check for notifications periodically
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const newNotifications = [];

      allTasks.forEach(task => {
        // Skip completed tasks for most notifications
        if (task.status === 'completed') return;

        const taskDate = new Date(task.due);
        const timeDiff = taskDate.getTime() - now.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        // Task due today
        if (dateUtils.isTaskDueToday(task) && !hasNotification(task._id, NOTIFICATION_TYPES.TASK_DUE_TODAY)) {
          newNotifications.push(createNotification(
            NOTIFICATION_TYPES.TASK_DUE_TODAY,
            `Task "${task.title}" is due today`,
            `Due at ${dateUtils.formatTimeSlot(taskDate)}`,
            task,
            'info'
          ));
        }

        // Overdue tasks
        if (dateUtils.isTaskOverdue(task) && !hasNotification(task._id, NOTIFICATION_TYPES.OVERDUE)) {
          newNotifications.push(createNotification(
            NOTIFICATION_TYPES.OVERDUE,
            `Task "${task.title}" is overdue`,
            `Was due ${dateUtils.formatDisplayDate(taskDate)}`,
            task,
            'error'
          ));
        }

        // Deadline approaching (configurable reminders)
        const reminderMinutes = settings?.reminderSettings?.defaultReminder || 15;
        if (minutesDiff > 0 && minutesDiff <= reminderMinutes && 
            !hasNotification(task._id, NOTIFICATION_TYPES.DEADLINE_APPROACHING)) {
          newNotifications.push(createNotification(
            NOTIFICATION_TYPES.DEADLINE_APPROACHING,
            `Task "${task.title}" due soon`,
            `Due in ${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''}`,
            task,
            'warning'
          ));
        }

        // 1 hour reminder
        if (hoursDiff === 1 && minutesDiff <= 60 && 
            !hasNotification(task._id, NOTIFICATION_TYPES.REMINDER)) {
          newNotifications.push(createNotification(
            NOTIFICATION_TYPES.REMINDER,
            `Task "${task.title}" due in 1 hour`,
            `Due at ${dateUtils.formatTimeSlot(taskDate)}`,
            task,
            'info'
          ));
        }

        // 1 day reminder
        if (daysDiff === 1 && !hasNotification(task._id, `${NOTIFICATION_TYPES.REMINDER}_1day`)) {
          newNotifications.push(createNotification(
            `${NOTIFICATION_TYPES.REMINDER}_1day`,
            `Task "${task.title}" due tomorrow`,
            `Due ${dateUtils.formatDisplayDate(taskDate)}`,
            task,
            'info'
          ));
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Keep last 10
        if (soundEnabled && settings?.reminderSettings?.enabled) {
          playNotificationSound();
        }
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          newNotifications.forEach(notification => {
            showBrowserNotification(notification);
          });
        }
      }

      setLastCheck(now);
    };

    // Initial check
    checkNotifications();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkNotifications, 60000); // Check every minute

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [allTasks, settings, soundEnabled]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper functions
  const createNotification = (type, title, message, task, severity = 'info') => ({
    id: `${task._id}_${type}_${Date.now()}`,
    type,
    title,
    message,
    task,
    severity,
    timestamp: new Date(),
    read: false
  });

  const hasNotification = (taskId, type) => {
    return notifications.some(n => 
      n.task._id === taskId && 
      n.type === type && 
      n.timestamp > new Date(Date.now() - 60000) // Within last minute
    );
  };

  const playNotificationSound = () => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.play().catch(//console.error);
    }
  };

  const showBrowserNotification = (notification) => {
    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico', // You'll need to add this
        tag: notification.id,
        requireInteraction: notification.severity === 'error'
      });

      browserNotification.onclick = () => {
        handleNotificationClick(notification);
        browserNotification.close();
      };

      // Auto close after 5 seconds for non-error notifications
      if (notification.severity !== 'error') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  };

  // Event handlers
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  }, [onNotificationClick]);

  const handleDismiss = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const handleDismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Get notification icon and color
  const getNotificationStyle = (severity) => {
    const styles = {
      error: {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-500'
      },
      warning: {
        icon: ClockIcon,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        iconColor: 'text-yellow-500'
      },
      info: {
        icon: CalendarIcon,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-500'
      },
      success: {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-500'
      }
    };
    return styles[severity] || styles.info;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`calendar-notifications ${className}`}>
      {/* Notification Bell */}
      <div className="relative">
        <motion.button
          onClick={() => setIsVisible(!isVisible)}
          className={`
            relative p-2 rounded-lg transition-colors
            ${unreadCount > 0 
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
              : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-400'
            }
            hover:bg-secondary-200 dark:hover:bg-secondary-600
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <BellIcon className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-200 dark:border-secondary-700 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
                <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleSound}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
                    title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                  >
                    {soundEnabled ? (
                      <SpeakerWaveIcon className="w-4 h-4" />
                    ) : (
                      <SpeakerXMarkIcon className="w-4 h-4" />
                    )}
                  </button>
                  {onSettingsClick && (
                    <button
                      onClick={onSettingsClick}
                      className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
                      title="Notification settings"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      No notifications
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                      You'll see reminders and alerts here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        onDismiss={() => handleDismiss(notification.id)}
                        style={getNotificationStyle(notification.severity)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900">
                  <button
                    onClick={handleDismissAll}
                    className="w-full text-sm text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
                  >
                    Dismiss All
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onClick, onDismiss, style }) => {
  const Icon = style.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        p-4 cursor-pointer transition-colors
        ${notification.read ? 'opacity-75' : ''}
        ${style.bgColor}
        hover:bg-opacity-80
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${style.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {notification.title}
              </p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="flex-shrink-0 ml-2 p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Task info */}
          {notification.task && (
            <div className="mt-2 p-2 bg-white dark:bg-secondary-700 rounded border border-secondary-200 dark:border-secondary-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                  {notification.task.title}
                </span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${notification.task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    notification.task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                `}>
                  {notification.task.priority}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarNotifications;