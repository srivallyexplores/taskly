import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-secondary-800 rounded-xl p-12 shadow-lg border border-secondary-200 dark:border-secondary-700 text-center ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
        </div>
      )}
      
      {title && (
        <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          {title}
        </h2>
      )}
      
      {description && (
        <p className="text-secondary-600 dark:text-secondary-400 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      
      {action && actionLabel && (
        <button
          onClick={action}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
