import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { useNotification } from '../../context/NotificationContext';

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    unreadCount,
    fetchUnreadCount
  } = useNotification();

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBellClick = () => {
    //console.log('🔔 NotificationBell: Bell clicked - navigating to settings');
    navigate('/settings?tab=notifications');
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationBell;
