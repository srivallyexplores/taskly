import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui';
import { 
  PlusIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const QuickActions = ({ onAction, className = '' }) => {
  const [hoveredAction, setHoveredAction] = useState(null);
  
  const quickActions = [
    {
      id: 'new-task',
      label: 'New Task',
      description: 'Create a new task',
      icon: PlusIcon,
      color: 'bg-primary-500 hover:bg-primary-600',
      shortcut: 'Ctrl+N',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'View your calendar',
      icon: CalendarIcon,
      color: 'bg-success-500 hover:bg-success-600',
      shortcut: 'Ctrl+S',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View detailed analytics',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      shortcut: 'Ctrl+A',
    },
    {
      id: 'team',
      label: 'Team',
      description: 'Manage your team',
      icon: UsersIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      shortcut: 'Ctrl+T',
    },
    {
      id: 'time-track',
      label: 'Time Track',
      description: 'Start time tracking',
      icon: ClockIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      shortcut: 'Ctrl+Space',
    },
    {
      id: 'notes',
      label: 'Quick Note',
      description: 'Jot down a quick note',
      icon: DocumentTextIcon,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      shortcut: 'Ctrl+Q',
    },
  ];
  
  const handleActionClick = (actionId) => {
    if (onAction) {
      onAction(actionId);
    }
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Quick Actions
        </h3>
        <BoltIcon className="w-5 h-5 text-primary-500" />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick(action.id)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={`
                relative p-4 rounded-lg text-white transition-all duration-200
                ${action.color} shadow-sm hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                group overflow-hidden
              `}
            >
              {/* Background gradient animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                initial={{ x: '-100%' }}
                animate={{ x: hoveredAction === action.id ? '100%' : '-100%' }}
                transition={{ duration: 0.6 }}
              />
              
              <div className="relative z-10">
                <Icon className="w-6 h-6 mb-2 mx-auto" />
                <div className="text-sm font-medium mb-1">
                  {action.label}
                </div>
                <div className="text-xs opacity-90">
                  {action.shortcut}
                </div>
              </div>
              
              {/* Tooltip */}
              {hoveredAction === action.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-secondary-900 dark:bg-secondary-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20"
                >
                  {action.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-secondary-900 dark:border-t-secondary-700"></div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Pro tip */}
      <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <div className="flex items-center">
          <StarIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0" />
          <p className="text-xs text-primary-700 dark:text-primary-300">
            <strong>Pro tip:</strong> Use keyboard shortcuts for faster access to these actions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;