import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    //console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In a real app, you would send this to your error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous'
    };

    // Example: Send to error reporting service
    // errorReportingService.report(errorReport);
    
    //console.error('Error Report:', errorReport);
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const bugReport = {
      errorId,
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Create mailto link with bug report
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(bugReport, null, 2)}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@taskly.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center"
          >
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-error-500" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on a fix.
            </p>

            {/* Error ID */}
            {errorId && (
              <div className="bg-secondary-100 dark:bg-secondary-700 rounded-lg p-3 mb-6">
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-1">
                  Error ID
                </p>
                <p className="text-sm font-mono text-secondary-700 dark:text-secondary-300">
                  {errorId}
                </p>
              </div>
            )}

            {/* Development Error Details */}
            {isDevelopment && error && (
              <details className="text-left mb-6 bg-secondary-100 dark:bg-secondary-700 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Error Details (Development)
                </summary>
                <div className="text-xs font-mono text-error-600 dark:text-error-400 whitespace-pre-wrap break-all">
                  <strong>Message:</strong> {error.message}
                  {error.stack && (
                    <>
                      <br /><br />
                      <strong>Stack:</strong>
                      <br />
                      {error.stack}
                    </>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                leftIcon={<ArrowPathIcon className="w-4 h-4" />}
              >
                Try Again
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                  leftIcon={<HomeIcon className="w-4 h-4" />}
                >
                  Go Home
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={this.handleReportBug}
                  className="flex-1"
                  leftIcon={<BugAntIcon className="w-4 h-4" />}
                >
                  Report Bug
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-6">
              If this problem persists, please contact our support team with the error ID above.
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    //console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidMount() {
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection = (event) => {
    //console.error('Unhandled promise rejection:', event.reason);
    
    this.setState({
      hasError: true,
      error: event.reason
    });
    
    // Prevent default browser error handling
    event.preventDefault();
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-error-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-secondary-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    //console.error('Error captured:', error);
    setError(error);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { captureError, resetError };
};

export default ErrorBoundary;