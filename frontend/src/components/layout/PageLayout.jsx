import React from 'react';
import { motion } from 'framer-motion';

const PageLayout = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-secondary-50 dark:bg-secondary-900 transition-colors duration-200 ${className}`}>
      {/* Main content area with sidebar offset */}
      <div className="lg:pl-64">
        <div className="flex flex-col min-h-screen">
          {children}
        </div>
      </div>
      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-16" />
    </div>
  );
};

// Page Header Component
PageLayout.Header = ({ 
  title, 
  subtitle, 
  children, 
  className = '',
  showBorder = true 
}) => (
  <motion.header
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white dark:bg-secondary-900 ${showBorder ? 'border-b border-secondary-200 dark:border-secondary-700' : ''} ${className}`}
  >
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {title && (
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center space-x-3">
            {children}
          </div>
        )}
      </div>
    </div>
  </motion.header>
);

// Page Content Component
PageLayout.Content = ({ children, className = '', padding = true }) => (
  <main className={`flex-1 ${padding ? 'px-4 sm:px-6 lg:px-8 py-6' : ''} ${className}`}>
    {children}
  </main>
);

// Page Sidebar Component
PageLayout.Sidebar = ({ children, className = '', width = 'w-64' }) => (
  <aside className={`${width} flex-shrink-0 ${className}`}>
    {children}
  </aside>
);

// Page Main Content Component
PageLayout.Main = ({ children, className = '' }) => (
  <div className={`flex-1 min-w-0 ${className}`}>
    {children}
  </div>
);

// Page Actions Component
PageLayout.Actions = ({ children, className = '' }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    {children}
  </div>
);

// Grid Layout Component
PageLayout.Grid = ({ 
  children, 
  cols = 1, 
  gap = 6, 
  className = '',
  responsive = true 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };
  
  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };
  
  const colClass = responsive ? gridCols[cols] : `grid-cols-${cols}`;
  
  return (
    <div className={`grid ${colClass} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Container Component
PageLayout.Container = ({ 
  children, 
  size = 'default', 
  className = '' 
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-full',
    full: 'w-full',
  };
  
  return (
    <div className={`${sizes[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

// Section Component
PageLayout.Section = ({ 
  children, 
  title, 
  subtitle, 
  className = '',
  spacing = 'default' 
}) => {
  const spacings = {
    tight: 'space-y-4',
    default: 'space-y-6',
    loose: 'space-y-8',
  };
  
  return (
    <section className={`${spacings[spacing]} ${className}`}>
      {(title || subtitle) && (
        <div>
          {title && (
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
};

export default PageLayout;