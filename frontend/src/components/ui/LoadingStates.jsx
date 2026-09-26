import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Skeleton loader components
export const SkeletonCard = ({ className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-secondary-200 dark:bg-secondary-700 rounded-lg p-4 space-y-3">
      <div className="h-4 bg-secondary-300 dark:bg-secondary-600 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-secondary-300 dark:bg-secondary-600 rounded"></div>
        <div className="h-3 bg-secondary-300 dark:bg-secondary-600 rounded w-5/6"></div>
      </div>
      <div className="flex space-x-2">
        <div className="h-6 bg-secondary-300 dark:bg-secondary-600 rounded-full w-16"></div>
        <div className="h-6 bg-secondary-300 dark:bg-secondary-600 rounded-full w-20"></div>
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-white dark:bg-secondary-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-secondary-50 dark:bg-secondary-700 px-6 py-3 border-b border-secondary-200 dark:border-secondary-600">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-secondary-300 dark:bg-secondary-600 rounded w-24"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-secondary-200 dark:divide-secondary-600">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-24"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Loading spinner with different sizes
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

// Loading overlay for full-screen loading
export const LoadingOverlay = ({ message = 'Loading...', className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`fixed inset-0 bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
  >
    <div className="text-center">
      <LoadingSpinner size="xl" className="mb-4" />
      <p className="text-secondary-600 dark:text-secondary-400 font-medium">
        {message}
      </p>
    </div>
  </motion.div>
);

// Loading state for buttons
export const ButtonLoading = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} className="mr-2" />
);

// Empty state component
export const EmptyState = ({ 
  icon: Icon = CheckIcon,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  action,
  className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`text-center py-12 ${className}`}
  >
    <div className="mx-auto w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
    </div>
    <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
      {title}
    </h3>
    <p className="text-secondary-500 dark:text-secondary-400 mb-6 max-w-sm mx-auto">
      {description}
    </p>
    {action && (
      <div className="flex justify-center">
        {action}
      </div>
    )}
  </motion.div>
);

// Error state component
export const ErrorState = ({ 
  title = 'Something went wrong',
  description = 'We encountered an error while loading your data.',
  onRetry,
  className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`text-center py-12 ${className}`}
  >
    <div className="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon className="w-8 h-8 text-error-500" />
    </div>
    <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
      {title}
    </h3>
    <p className="text-secondary-500 dark:text-secondary-400 mb-6 max-w-sm mx-auto">
      {description}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
      >
        Try again
      </button>
    )}
  </motion.div>
);

// Progressive loading component
export const ProgressiveLoader = ({ 
  steps = [],
  currentStep = 0,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {steps.map((step, index) => (
      <div key={index} className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          index < currentStep 
            ? 'bg-success-500 text-white' 
            : index === currentStep 
            ? 'bg-primary-500 text-white' 
            : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-400'
        }`}>
          {index < currentStep ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : index === currentStep ? (
            <LoadingSpinner size="sm" />
          ) : (
            <span className="text-xs font-medium">{index + 1}</span>
          )}
        </div>
        <span className={`text-sm font-medium ${
          index <= currentStep 
            ? 'text-secondary-900 dark:text-secondary-100' 
            : 'text-secondary-500 dark:text-secondary-400'
        }`}>
          {step}
        </span>
      </div>
    ))}
  </div>
);

// Lazy loading wrapper
export const LazyLoader = ({ 
  children, 
  fallback = <LoadingSpinner />,
  className = ''
}) => (
  <React.Suspense fallback={
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {fallback}
    </div>
  }>
    {children}
  </React.Suspense>
);

// Data loading wrapper with error handling
export const DataLoader = ({ 
  loading,
  error,
  data,
  children,
  emptyState,
  errorState,
  loadingState,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={className}>
        {loadingState || <LoadingSpinner size="lg" className="py-12" />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        {errorState || <ErrorState />}
      </div>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={className}>
        {emptyState || <EmptyState />}
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default {
  SkeletonCard,
  SkeletonList,
  SkeletonTable,
  LoadingSpinner,
  LoadingOverlay,
  ButtonLoading,
  EmptyState,
  ErrorState,
  ProgressiveLoader,
  LazyLoader,
  DataLoader
};