import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  WifiIcon,
  CloudIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingStates';

// Generic fallback component
export const GenericFallback = ({ 
  error, 
  resetError,
  title = 'Something went wrong',
  description = 'We encountered an unexpected error.',
  showRetry = true,
  showHome = true
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-4">
      <ExclamationTriangleIcon className="w-8 h-8 text-error-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      {title}
    </h3>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
      {description}
    </p>
    
    {process.env.NODE_ENV === 'development' && error && (
      <details className="mb-6 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg text-left max-w-md w-full">
        <summary className="cursor-pointer text-sm font-medium mb-2">
          Error Details
        </summary>
        <pre className="text-xs text-error-600 dark:text-error-400 whitespace-pre-wrap">
          {error.message}
          {error.stack && `\n\n${error.stack}`}
        </pre>
      </details>
    )}
    
    <div className="flex space-x-3">
      {showRetry && (
        <Button
          onClick={resetError}
          leftIcon={<ArrowPathIcon className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}
      
      {showHome && (
        <Button
          variant="outline"
          onClick={() => window.location.href = '/'}
          leftIcon={<HomeIcon className="w-4 h-4" />}
        >
          Go Home
        </Button>
      )}
    </div>
  </motion.div>
);

// Network error fallback
export const NetworkErrorFallback = ({ error, resetError }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mb-4">
      <WifiIcon className="w-8 h-8 text-warning-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      Connection Problem
    </h3>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
      We're having trouble connecting to our servers. Please check your internet connection and try again.
    </p>
    
    <div className="flex space-x-3">
      <Button
        onClick={resetError}
        leftIcon={<ArrowPathIcon className="w-4 h-4" />}
      >
        Retry Connection
      </Button>
      
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </Button>
    </div>
  </motion.div>
);

// Server error fallback
export const ServerErrorFallback = ({ error, resetError }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-4">
      <ServerIcon className="w-8 h-8 text-error-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      Server Error
    </h3>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
      Our servers are experiencing issues. Our team has been notified and is working on a fix.
    </p>
    
    <div className="flex space-x-3">
      <Button
        onClick={resetError}
        leftIcon={<ArrowPathIcon className="w-4 h-4" />}
      >
        Try Again
      </Button>
      
      <Button
        variant="outline"
        onClick={() => window.open('https://status.taskly.com', '_blank')}
      >
        Check Status
      </Button>
    </div>
  </motion.div>
);

// Chunk load error fallback
export const ChunkErrorFallback = ({ error, resetError }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center p-8 text-center"
  >
    <div className="w-16 h-16 bg-info-100 dark:bg-info-900/20 rounded-full flex items-center justify-center mb-4">
      <CloudIcon className="w-8 h-8 text-info-500" />
    </div>
    
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      Update Available
    </h3>
    
    <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
      A new version of the app is available. Please refresh the page to get the latest updates.
    </p>
    
    <div className="flex space-x-3">
      <Button
        onClick={() => window.location.reload()}
        leftIcon={<ArrowPathIcon className="w-4 h-4" />}
      >
        Refresh Now
      </Button>
      
      <Button
        variant="outline"
        onClick={resetError}
      >
        Continue Anyway
      </Button>
    </div>
  </motion.div>
);

// Loading fallback with timeout
export const LoadingFallback = ({ 
  timeout = 10000,
  onTimeout,
  message = 'Loading...'
}) => {
  const [showTimeout, setShowTimeout] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
      if (onTimeout) onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout, onTimeout]);

  if (showTimeout) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-warning-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
          Taking longer than expected
        </h3>
        
        <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
          This is taking longer than usual. You can wait a bit more or try refreshing the page.
        </p>
        
        <div className="flex space-x-3">
          <Button
            onClick={() => window.location.reload()}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh Page
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowTimeout(false)}
          >
            Keep Waiting
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-secondary-600 dark:text-secondary-400">
        {message}
      </p>
    </motion.div>
  );
};

// Component-specific fallbacks
export const TasksFallback = ({ error, resetError }) => (
  <GenericFallback
    error={error}
    resetError={resetError}
    title="Tasks couldn't load"
    description="We're having trouble loading your tasks. This might be a temporary issue."
  />
);

export const ProjectsFallback = ({ error, resetError }) => (
  <GenericFallback
    error={error}
    resetError={resetError}
    title="Projects couldn't load"
    description="We're having trouble loading your projects. This might be a temporary issue."
  />
);

export const AnalyticsFallback = ({ error, resetError }) => (
  <GenericFallback
    error={error}
    resetError={resetError}
    title="Analytics couldn't load"
    description="We're having trouble loading your analytics data. This might be a temporary issue."
  />
);

export const DashboardFallback = ({ error, resetError }) => (
  <GenericFallback
    error={error}
    resetError={resetError}
    title="Dashboard couldn't load"
    description="We're having trouble loading your dashboard. This might be a temporary issue."
  />
);

// Error boundary factory
export const createErrorBoundary = (FallbackComponent = GenericFallback) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      //console.error('Error caught by boundary:', error, errorInfo);
      
      // Report to error tracking service
      if (window.reportError) {
        window.reportError(error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={() => this.setState({ hasError: false, error: null })}
          />
        );
      }

      return this.props.children;
    }
  };
};

// Smart error boundary that chooses fallback based on error type
export const SmartErrorBoundary = ({ children }) => {
  const [error, setError] = React.useState(null);

  const resetError = () => setError(null);

  const getFallbackComponent = (error) => {
    if (!error) return GenericFallback;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorStack = error.stack?.toLowerCase() || '';

    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') ||
        errorMessage.includes('connection')) {
      return NetworkErrorFallback;
    }

    // Server errors
    if (errorMessage.includes('server') ||
        errorMessage.includes('500') ||
        errorMessage.includes('503')) {
      return ServerErrorFallback;
    }

    // Chunk loading errors
    if (errorMessage.includes('chunk') ||
        errorMessage.includes('loading') ||
        errorStack.includes('chunk')) {
      return ChunkErrorFallback;
    }

    return GenericFallback;
  };

  React.useEffect(() => {
    const handleError = (event) => {
      setError(event.error);
    };

    const handleUnhandledRejection = (event) => {
      setError(event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (error) {
    const FallbackComponent = getFallbackComponent(error);
    return <FallbackComponent error={error} resetError={resetError} />;
  }

  return children;
};

export default {
  GenericFallback,
  NetworkErrorFallback,
  ServerErrorFallback,
  ChunkErrorFallback,
  LoadingFallback,
  TasksFallback,
  ProjectsFallback,
  AnalyticsFallback,
  DashboardFallback,
  createErrorBoundary,
  SmartErrorBoundary
};