import React from 'react';
import { motion } from 'framer-motion';
import { 
  ListBulletIcon,
  Squares2X2Icon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const TaskViewSelector = ({ currentView, onViewChange, className = '' }) => {
  const views = [
    {
      id: 'list',
      name: 'List',
      icon: ListBulletIcon,
      description: 'Traditional list view',
    },
    {
      id: 'board',
      name: 'Board',
      icon: Squares2X2Icon,
      description: 'Kanban board view',
    },
    {
      id: 'calendar',
      name: 'Calendar',
      icon: CalendarIcon,
      description: 'Calendar view',
    },
    {
      id: 'timeline',
      name: 'Timeline',
      icon: ChartBarIcon,
      description: 'Timeline view',
    },
  ];
  
  return (
    <div className={`flex items-center space-x-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1 ${className}`}>
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = currentView === view.id;
        
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              relative flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'text-primary-700 dark:text-primary-300' 
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-100'
              }
            `}
            title={view.description}
          >
            {isActive && (
              <motion.div
                layoutId="activeViewBackground"
                className="absolute inset-0 bg-white dark:bg-secondary-700 rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            
            <div className="relative z-10 flex items-center">
              <Icon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{view.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TaskViewSelector;