import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

const MobileNavigation = ({ activeTab, onTabChange, onQuickAction }) => {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  
  const bottomTabs = [
    {
      id: 'dashboard',
      name: 'Home',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      color: 'text-primary-600'
    },
    {
      id: 'tasks',
      name: 'Tasks',
      icon: CheckCircleIcon,
      activeIcon: CheckCircleIconSolid,
      color: 'text-success-600'
    },
    {
      id: 'add',
      name: 'Add',
      icon: PlusIcon,
      activeIcon: PlusIcon,
      color: 'text-white',
      isSpecial: true
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: ChartBarIcon,
      activeIcon: ChartBarIconSolid,
      color: 'text-purple-600'
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
      color: 'text-orange-600'
    }
  ];
  
  const quickActions = [
    {
      id: 'quick-task',
      name: 'Quick Task',
      icon: CheckCircleIcon,
      color: 'bg-success-500',
      action: () => onQuickAction?.('create-task')
    },
    {
      id: 'voice-note',
      name: 'Voice Note',
      icon: MagnifyingGlassIcon,
      color: 'bg-blue-500',
      action: () => onQuickAction?.('voice-note')
    },
    {
      id: 'scan-document',
      name: 'Scan',
      icon: Cog6ToothIcon,
      color: 'bg-purple-500',
      action: () => onQuickAction?.('scan-document')
    }
  ];
  
  const sidebarItems = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon, badge: notificationCount },
    { id: 'search', name: 'Search', icon: MagnifyingGlassIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ];
  
  const handleTabPress = (tabId) => {
    if (tabId === 'add') {
      setShowQuickActions(!showQuickActions);
    } else {
      onTabChange?.(tabId);
      setShowQuickActions(false);
    }
  };
  
  const handleQuickAction = (action) => {
    action.action();
    setShowQuickActions(false);
  };
  
  // Close quick actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showQuickActions && !event.target.closest('.quick-actions-container')) {
        setShowQuickActions(false);
      }
    };
    
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showQuickActions]);
  
  return (
    <>
      {/* Top Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 -ml-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            TaskFlow
          </h1>
          
          <button
            onClick={() => onQuickAction?.('notifications')}
            className="relative p-2 -mr-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100 transition-colors"
          >
            <BellIcon className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
              onClick={() => setShowSidebar(false)}
            />
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-80 bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">
                    Menu
                  </h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onQuickAction?.(item.id);
                          setShowSidebar(false);
                        }}
                        className="w-full flex items-center justify-between p-3 text-left rounded-lg text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-error-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 flex items-end justify-center pb-24"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="quick-actions-container bg-white dark:bg-secondary-800 rounded-t-3xl p-6 w-full max-w-sm mx-4 border-t border-secondary-200 dark:border-secondary-700"
            >
              <div className="w-12 h-1 bg-secondary-300 dark:bg-secondary-600 rounded-full mx-auto mb-6" />
              
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 text-center mb-6">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickAction(action)}
                      className="flex flex-col items-center space-y-3 p-4 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        {action.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-secondary-800 border-t border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = isActive ? tab.activeIcon : tab.icon;
            
            if (tab.isSpecial) {
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabPress(tab.id)}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      rotate: showQuickActions ? 45 : 0,
                      scale: showQuickActions ? 1.1 : 1
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  {/* Ripple effect */}
                  {showQuickActions && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="absolute inset-0 bg-primary-500 rounded-full"
                    />
                  )}
                </motion.button>
              );
            }
            
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabPress(tab.id)}
                className="flex flex-col items-center space-y-1 p-2 min-w-0 flex-1"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive
                        ? tab.color
                        : 'text-secondary-400 dark:text-secondary-500'
                    }`}
                  />
                </motion.div>
                
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive
                      ? tab.color
                      : 'text-secondary-400 dark:text-secondary-500'
                  }`}
                >
                  {tab.name}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 w-1 h-1 bg-current rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;