import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui';
import { 
  EllipsisHorizontalIcon,
  ArrowsPointingOutIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const DashboardWidget = ({
  title,
  subtitle,
  size = 'md',
  loading = false,
  error = null,
  children,
  actions,
  onExpand,
  onRemove,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 md:col-span-2 row-span-1',
    lg: 'col-span-1 md:col-span-2 lg:col-span-3 row-span-2',
    xl: 'col-span-1 md:col-span-2 lg:col-span-4 row-span-2',
    full: 'col-span-full row-span-2',
  };
  
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded"></div>
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-5/6"></div>
        <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-4/6"></div>
      </div>
    </div>
  );
  
  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-4">
        <XMarkIcon className="w-6 h-6 text-error-600 dark:text-error-400" />
      </div>
      <p className="text-sm text-error-600 dark:text-error-400 mb-2">
        Failed to load widget
      </p>
      <p className="text-xs text-secondary-500 dark:text-secondary-400">
        {error?.message || 'An error occurred'}
      </p>
    </div>
  );
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`${sizeClasses[size]} ${className}`}
      {...props}
    >
      <Card variant="elevated" padding="md" className="h-full flex flex-col">
        {/* Widget Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Widget Actions */}
          <div className="flex items-center space-x-1 ml-4">
            {actions}
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors"
                title="Expand widget"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 text-secondary-400 hover:text-error-600 dark:hover:text-error-400 rounded transition-colors"
                title="Remove widget"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded transition-colors">
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Widget Content */}
        <div className="flex-1 min-h-0">
          {loading && <LoadingSkeleton />}
          {error && !loading && <ErrorState />}
          {!loading && !error && children}
        </div>
      </Card>
    </motion.div>
  );
};

// Widget sub-components
DashboardWidget.Header = ({ children, className = '', ...props }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
    {children}
  </div>
);

DashboardWidget.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-secondary-900 dark:text-secondary-100 ${className}`} {...props}>
    {children}
  </h3>
);

DashboardWidget.Subtitle = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-secondary-500 dark:text-secondary-400 ${className}`} {...props}>
    {children}
  </p>
);

DashboardWidget.Content = ({ children, className = '', scrollable = false, ...props }) => (
  <div 
    className={`flex-1 ${scrollable ? 'overflow-y-auto scrollbar-hide' : ''} ${className}`} 
    {...props}
  >
    {children}
  </div>
);

DashboardWidget.Actions = ({ children, className = '', ...props }) => (
  <div className={`flex items-center space-x-2 ${className}`} {...props}>
    {children}
  </div>
);

DashboardWidget.Metric = ({ 
  value, 
  label, 
  change, 
  changeType = 'neutral',
  className = '',
  ...props 
}) => {
  const changeColors = {
    positive: 'text-success-600 dark:text-success-400',
    negative: 'text-error-600 dark:text-error-400',
    neutral: 'text-secondary-500 dark:text-secondary-400',
  };
  
  return (
    <div className={`text-center ${className}`} {...props}>
      <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
        {value}
      </div>
      <div className="text-sm text-secondary-500 dark:text-secondary-400">
        {label}
      </div>
      {change && (
        <div className={`text-xs mt-1 ${changeColors[changeType]}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export default DashboardWidget;