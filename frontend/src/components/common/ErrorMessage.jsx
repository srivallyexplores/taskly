import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ 
  message, 
  type = 'error', 
  className = '', 
  onRetry,
  onDismiss 
}) => {
  const typeStyles = {
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-400',
      text: 'text-red-800 dark:text-red-200',
      button: 'text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      icon: 'text-yellow-400',
      text: 'text-yellow-800 dark:text-yellow-200',
      button: 'text-yellow-600 hover:text-yellow-500 dark:text-yellow-400 dark:hover:text-yellow-300'
    }
  };

  const styles = typeStyles[type] || typeStyles.error;
  const Icon = type === 'warning' ? ExclamationTriangleIcon : XCircleIcon;

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${styles.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${styles.text}`}>
            {message || 'An error occurred'}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="flex space-x-2">
            {onRetry && (
              <button
                type="button"
                className={`text-sm font-medium ${styles.button} hover:underline`}
                onClick={onRetry}
              >
                Try again
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                className={`text-sm font-medium ${styles.button} hover:underline`}
                onClick={onDismiss}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;