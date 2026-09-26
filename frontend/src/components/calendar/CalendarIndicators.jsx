import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon,
  FireIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { useCalendar } from '../../context/CalendarContext';
import { dateUtils } from '../../utils/dateUtils';

const CalendarIndicators = ({
  showTodayIndicator = true,
  showOverdueIndicator = true,
  showStreakIndicator = true,
  showProductivityIndicator = true,
  position = 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  className = ''
}) => {
  const { allTasks, currentDate } = useCalendar();

  // Calculate indicators data
  const indicators = useMemo(() => {
    const today = new Date();
    
    // Today's tasks
    const todayTasks = allTasks.filter(task => dateUtils.isTaskDueToday(task));
    const todayCompleted = todayTasks.filter(task => task.status === 'completed').length;
    const todayTotal = todayTasks.length;
    
    // Overdue tasks
    const overdueTasks = allTasks.filter(task => dateUtils.isTaskOverdue(task));
    
    // Streak calculation (simplified)
    const streak = calculateStreak(allTasks);
    
    // Productivity score (simplified)
    const productivityScore = calculateProductivityScore(allTasks);
    
    return {
      today: {
        total: todayTotal,
        completed: todayCompleted,
        remaining: todayTotal - todayCompleted,
        percentage: todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0
      },
      overdue: {
        count: overdueTasks.length,
        tasks: overdueTasks
      },
      streak: {
        current: streak.current,
        longest: streak.longest,
        isActive: streak.isActive
      },
      productivity: {
        score: productivityScore,
        trend: getProductivityTrend(allTasks)
      }
    };
  }, [allTasks]);

  // Helper functions
  const calculateStreak = (tasks) => {
    // Simplified streak calculation
    // In a real implementation, you'd track daily completion history
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const recentCompleted = completedTasks.filter(task => {
      const taskDate = new Date(task.updatedAt || task.createdAt);
      const daysDiff = Math.floor((new Date() - taskDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7; // Last 7 days
    });
    
    return {
      current: Math.min(recentCompleted.length, 7),
      longest: Math.min(completedTasks.length, 30),
      isActive: recentCompleted.length > 0
    };
  };

  const calculateProductivityScore = (tasks) => {
    if (tasks.length === 0) return 0;
    
    const completed = tasks.filter(task => task.status === 'completed').length;
    const overdue = tasks.filter(task => dateUtils.isTaskOverdue(task)).length;
    const total = tasks.length;
    
    const completionRate = (completed / total) * 100;
    const overdueRate = (overdue / total) * 100;
    
    // Simple scoring: completion rate minus overdue penalty
    return Math.max(0, Math.round(completionRate - (overdueRate * 0.5)));
  };

  const getProductivityTrend = (tasks) => {
    // Simplified trend calculation
    const recentTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const daysDiff = Math.floor((new Date() - taskDate) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    
    const recentCompleted = recentTasks.filter(task => task.status === 'completed').length;
    const recentTotal = recentTasks.length;
    
    if (recentTotal === 0) return 'stable';
    
    const recentRate = (recentCompleted / recentTotal) * 100;
    const overallRate = indicators?.productivity?.score || 0;
    
    if (recentRate > overallRate + 10) return 'up';
    if (recentRate < overallRate - 10) return 'down';
    return 'stable';
  };

  // Position classes
  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };
    return positions[position] || positions['top-right'];
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-40 space-y-3 ${className}`}>
      {/* Today's Tasks Indicator */}
      {showTodayIndicator && indicators.today.total > 0 && (
        <TodayIndicator data={indicators.today} />
      )}

      {/* Overdue Tasks Indicator */}
      {showOverdueIndicator && indicators.overdue.count > 0 && (
        <OverdueIndicator data={indicators.overdue} />
      )}

      {/* Streak Indicator */}
      {showStreakIndicator && indicators.streak.current > 0 && (
        <StreakIndicator data={indicators.streak} />
      )}

      {/* Productivity Indicator */}
      {showProductivityIndicator && (
        <ProductivityIndicator data={indicators.productivity} />
      )}
    </div>
  );
};

// Today's Tasks Indicator
const TodayIndicator = ({ data }) => {
  const getStatusColor = () => {
    if (data.percentage === 100) return 'bg-green-500';
    if (data.percentage >= 75) return 'bg-blue-500';
    if (data.percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 p-4 min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
            Today's Tasks
          </span>
        </div>
        {data.percentage === 100 && (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-600 dark:text-secondary-400">
            {data.completed} of {data.total} completed
          </span>
          <span className="font-bold text-secondary-900 dark:text-secondary-100">
            {data.percentage}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${getStatusColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${data.percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        {data.remaining > 0 && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {data.remaining} task{data.remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Overdue Tasks Indicator
const OverdueIndicator = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-4 min-w-[200px]"
    >
      <div className="flex items-center space-x-2 mb-2">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
        </motion.div>
        <span className="text-sm font-semibold text-red-700 dark:text-red-300">
          Overdue Tasks
        </span>
      </div>
      
      <div className="space-y-1">
        <p className="text-lg font-bold text-red-600 dark:text-red-400">
          {data.count}
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">
          {data.count === 1 ? 'task needs' : 'tasks need'} attention
        </p>
      </div>
    </motion.div>
  );
};

// Streak Indicator
const StreakIndicator = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl shadow-lg p-4 min-w-[200px]"
    >
      <div className="flex items-center space-x-2 mb-2">
        <motion.div
          animate={data.isActive ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <FireIcon className="w-5 h-5 text-orange-500" />
        </motion.div>
        <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
          Streak
        </span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {data.current}
          </span>
          <span className="text-xs text-orange-600 dark:text-orange-400">
            days
          </span>
        </div>
        <p className="text-xs text-orange-600 dark:text-orange-400">
          Best: {data.longest} days
        </p>
      </div>
    </motion.div>
  );
};

// Productivity Indicator
const ProductivityIndicator = ({ data }) => {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-red-500 transform rotate-180" />;
      default:
        return <BoltIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getScoreColor = () => {
    if (data.score >= 80) return 'text-green-600 dark:text-green-400';
    if (data.score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (data.score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = () => {
    if (data.score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (data.score >= 60) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (data.score >= 40) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={`${getScoreBg()} border rounded-xl shadow-lg p-4 min-w-[200px]`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <BoltIcon className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
            Productivity
          </span>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${getScoreColor()}`}>
            {data.score}
          </span>
          <span className="text-xs text-secondary-500 dark:text-secondary-400">
            / 100
          </span>
        </div>
        <p className="text-xs text-secondary-500 dark:text-secondary-400">
          {data.trend === 'up' ? 'Trending up' : 
           data.trend === 'down' ? 'Trending down' : 'Stable'}
        </p>
      </div>
    </motion.div>
  );
};

// Today's Date Highlight Component (for calendar cells)
export const TodayHighlight = ({ date, children, className = '' }) => {
  const isToday = dateUtils.isToday(date);
  
  if (!isToday) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0.4)',
          '0 0 0 8px rgba(59, 130, 246, 0)',
          '0 0 0 0 rgba(59, 130, 246, 0)'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "loop"
      }}
    >
      {children}
      
      {/* Today indicator */}
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </motion.div>
  );
};

// Overdue Task Highlight Component
export const OverdueHighlight = ({ task, children, className = '' }) => {
  const isOverdue = dateUtils.isTaskOverdue(task);
  
  if (!isOverdue) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        backgroundColor: [
          'rgba(239, 68, 68, 0.1)',
          'rgba(239, 68, 68, 0.2)',
          'rgba(239, 68, 68, 0.1)'
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    >
      {children}
      
      {/* Overdue indicator */}
      <motion.div
        className="absolute -top-1 -left-1"
        animate={{
          rotate: [0, -10, 10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      </motion.div>
    </motion.div>
  );
};

export default CalendarIndicators;