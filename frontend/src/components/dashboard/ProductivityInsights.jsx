import React from 'react';
import { motion } from 'framer-motion';
import { 
  LightBulbIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ProductivityInsights = ({ 
  insights = [],
  loading = false,
  className = '' 
}) => {
  // Sample insights if none provided
  const sampleInsights = insights.length > 0 ? insights : [
    {
      id: 1,
      type: 'positive',
      title: 'Great Progress!',
      message: 'You completed 25% more tasks this week compared to last week.',
      icon: TrendingUpIcon,
      action: 'Keep up the momentum',
      priority: 'high',
    },
    {
      id: 2,
      type: 'suggestion',
      title: 'Optimize Your Schedule',
      message: 'You tend to be most productive between 9-11 AM. Consider scheduling important tasks during this time.',
      icon: ClockIcon,
      action: 'Adjust schedule',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Upcoming Deadline',
      message: 'You have 3 high-priority tasks due this week. Consider breaking them into smaller subtasks.',
      icon: ExclamationTriangleIcon,
      action: 'Review tasks',
      priority: 'high',
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Streak Achievement!',
      message: 'Congratulations! You\'ve maintained a 7-day productivity streak.',
      icon: CheckCircleIcon,
      action: 'Share achievement',
      priority: 'low',
    },
  ];
  
  const getInsightStyle = (type) => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-success-50 dark:bg-success-900/20',
          border: 'border-success-200 dark:border-success-800',
          icon: 'text-success-600 dark:text-success-400',
          title: 'text-success-800 dark:text-success-200',
        };
      case 'warning':
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/20',
          border: 'border-warning-200 dark:border-warning-800',
          icon: 'text-warning-600 dark:text-warning-400',
          title: 'text-warning-800 dark:text-warning-200',
        };
      case 'suggestion':
        return {
          bg: 'bg-primary-50 dark:bg-primary-900/20',
          border: 'border-primary-200 dark:border-primary-800',
          icon: 'text-primary-600 dark:text-primary-400',
          title: 'text-primary-800 dark:text-primary-200',
        };
      case 'achievement':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          icon: 'text-purple-600 dark:text-purple-400',
          title: 'text-purple-800 dark:text-purple-200',
        };
      default:
        return {
          bg: 'bg-secondary-50 dark:bg-secondary-800',
          border: 'border-secondary-200 dark:border-secondary-700',
          icon: 'text-secondary-600 dark:text-secondary-400',
          title: 'text-secondary-800 dark:text-secondary-200',
        };
    }
  };
  
  if (loading) {
    return (
      <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary-200 dark:bg-secondary-700 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
              <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Productivity Insights
        </h3>
        <LightBulbIcon className="w-5 h-5 text-primary-500" />
      </div>
      
      <div className="space-y-4">
        {sampleInsights.map((insight, index) => {
          const Icon = insight.icon;
          const style = getInsightStyle(insight.type);
          
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${style.bg} ${style.border} transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-start">
                <div className={`w-8 h-8 rounded-lg bg-white dark:bg-secondary-800 flex items-center justify-center mr-3 flex-shrink-0 shadow-sm`}>
                  <Icon className={`w-4 h-4 ${style.icon}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-semibold ${style.title}`}>
                      {insight.title}
                    </h4>
                    {insight.priority === 'high' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-300">
                        High Priority
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                    {insight.message}
                  </p>
                  
                  <button className={`text-xs font-medium ${style.icon} hover:underline focus:outline-none`}>
                    {insight.action} →
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* View all insights link */}
      <div className="mt-6 text-center">
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline focus:outline-none">
          View All Insights
        </button>
      </div>
    </div>
  );
};

export default ProductivityInsights;