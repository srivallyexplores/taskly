import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  FireIcon,
  TrophyIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const ExperiencePoints = ({ onXPGained, className = '' }) => {
  const [recentXPGains, setRecentXPGains] = useState([]);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [animatingXP, setAnimatingXP] = useState(0);
  
  // XP values for different actions
  const xpValues = {
    'task-complete': { base: 10, multiplier: 1, icon: CheckCircleIcon, color: 'text-success-500' },
    'task-complete-early': { base: 15, multiplier: 1.5, icon: ClockIcon, color: 'text-primary-500' },
    'high-priority-complete': { base: 25, multiplier: 2, icon: StarIcon, color: 'text-warning-500' },
    'streak-day': { base: 5, multiplier: 1, icon: FireIcon, color: 'text-orange-500' },
    'streak-week': { base: 50, multiplier: 1, icon: FireIcon, color: 'text-red-500' },
    'first-task-day': { base: 20, multiplier: 1, icon: CalendarIcon, color: 'text-blue-500' },
    'team-collaboration': { base: 15, multiplier: 1, icon: UserGroupIcon, color: 'text-purple-500' },
    'milestone-reached': { base: 100, multiplier: 1, icon: TrophyIcon, color: 'text-yellow-500' }
  };
  
  // Sample recent XP gains
  const sampleXPGains = [
    {
      id: 1,
      action: 'task-complete',
      description: 'Completed "Design user interface"',
      xp: 10,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      multiplier: 1
    },
    {
      id: 2,
      action: 'high-priority-complete',
      description: 'Completed high priority task',
      xp: 25,
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      multiplier: 2
    },
    {
      id: 3,
      action: 'streak-day',
      description: '7-day completion streak!',
      xp: 5,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      multiplier: 1
    },
    {
      id: 4,
      action: 'team-collaboration',
      description: 'Helped teammate with task',
      xp: 15,
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      multiplier: 1
    }
  ];
  
  useEffect(() => {
    setRecentXPGains(sampleXPGains);
  }, []);
  
  const calculateXP = (action, taskPriority = 'medium', isEarly = false, streakDays = 0) => {
    const config = xpValues[action];
    if (!config) return 0;
    
    let xp = config.base;
    
    // Apply priority multiplier
    if (taskPriority === 'high') {
      xp *= 1.5;
    } else if (taskPriority === 'low') {
      xp *= 0.8;
    }
    
    // Apply early completion bonus
    if (isEarly) {
      xp *= 1.2;
    }
    
    // Apply streak multiplier
    if (streakDays > 0) {
      const streakMultiplier = Math.min(1 + (streakDays * 0.1), 2); // Max 2x multiplier
      xp *= streakMultiplier;
    }
    
    return Math.round(xp);
  };
  
  const awardXP = (action, description, options = {}) => {
    const xp = calculateXP(action, options.priority, options.isEarly, options.streakDays);
    
    const newXPGain = {
      id: Date.now(),
      action,
      description,
      xp,
      timestamp: new Date(),
      multiplier: options.multiplier || 1
    };
    
    setRecentXPGains(prev => [newXPGain, ...prev.slice(0, 9)]); // Keep last 10
    
    // Trigger animation
    setAnimatingXP(xp);
    setShowXPAnimation(true);
    
    // Hide animation after delay
    setTimeout(() => {
      setShowXPAnimation(false);
    }, 2000);
    
    // Notify parent component
    onXPGained?.(xp, newXPGain);
  };
  
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  
  const getActionConfig = (action) => {
    return xpValues[action] || { icon: PlusIcon, color: 'text-secondary-500' };
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Experience Points
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <StarIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      {/* XP Animation */}
      <AnimatePresence>
        {showXPAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 1.2 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full shadow-2xl">
              <div className="flex items-center space-x-2">
                <PlusIcon className="w-5 h-5" />
                <span className="text-lg font-bold">{animatingXP} XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* XP Actions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Quick Actions (Demo)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => awardXP('task-complete', 'Completed a task', { priority: 'medium' })}
            className="p-3 text-left bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-4 h-4 text-success-500" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">Complete Task</span>
            </div>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">+10 XP</span>
          </button>
          
          <button
            onClick={() => awardXP('high-priority-complete', 'Completed high priority task', { priority: 'high' })}
            className="p-3 text-left bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <StarIcon className="w-4 h-4 text-warning-500" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">High Priority</span>
            </div>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">+25 XP</span>
          </button>
          
          <button
            onClick={() => awardXP('streak-day', '7-day streak achieved!', { streakDays: 7 })}
            className="p-3 text-left bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <FireIcon className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">Streak Bonus</span>
            </div>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">+5 XP</span>
          </button>
          
          <button
            onClick={() => awardXP('team-collaboration', 'Helped a teammate', {})}
            className="p-3 text-left bg-secondary-50 dark:bg-secondary-700 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-secondary-700 dark:text-secondary-300">Team Help</span>
            </div>
            <span className="text-xs text-secondary-500 dark:text-secondary-400">+15 XP</span>
          </button>
        </div>
      </div>
      
      {/* Recent XP Gains */}
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Recent XP Gains
        </h4>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentXPGains.map((gain, index) => {
            const config = getActionConfig(gain.action);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={gain.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg bg-white dark:bg-secondary-800 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 truncate">
                      {gain.description}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {getTimeAgo(gain.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {gain.multiplier > 1 && (
                    <span className="text-xs text-warning-600 dark:text-warning-400 font-medium">
                      {gain.multiplier}x
                    </span>
                  )}
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    +{gain.xp}
                  </span>
                </div>
              </motion.div>
            );
          })}
          
          {recentXPGains.length === 0 && (
            <div className="text-center py-8">
              <StarIcon className="w-8 h-8 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                No XP gains yet
              </p>
              <p className="text-xs text-secondary-400 dark:text-secondary-500 mt-1">
                Complete tasks to start earning experience points
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* XP Multipliers Info */}
      <div className="mt-6 pt-4 border-t border-secondary-200 dark:border-secondary-700">
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          XP Multipliers
        </h4>
        <div className="text-xs text-secondary-500 dark:text-secondary-400 space-y-1">
          <div className="flex justify-between">
            <span>High Priority Tasks:</span>
            <span className="text-warning-600 dark:text-warning-400">+50% XP</span>
          </div>
          <div className="flex justify-between">
            <span>Early Completion:</span>
            <span className="text-success-600 dark:text-success-400">+20% XP</span>
          </div>
          <div className="flex justify-between">
            <span>Streak Bonus:</span>
            <span className="text-orange-600 dark:text-orange-400">Up to +100% XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperiencePoints;