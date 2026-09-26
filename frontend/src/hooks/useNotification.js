import { useCallback } from 'react';

/**
 * Custom hook for showing notifications
 * This is a simple implementation that can be enhanced with a proper notification system
 */
export const useNotification = () => {
  const showNotification = useCallback(({ type, message, duration = 5000 }) => {
    // For now, we'll use //console.log and alert as a fallback
    // In a real app, this would integrate with a toast notification library
    
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    
    switch (type) {
      case 'success':
        //console.log(`✅ ${logMessage}`);
        break;
      case 'error':
        //console.error(`❌ ${logMessage}`);
        // For errors, also show an alert for now
        alert(`Error: ${message}`);
        break;
      case 'warning':
        //console.warn(`  ${logMessage}`);
        break;
      case 'info':
      default:
        //console.info(`ℹ️ ${logMessage}`);
        break;
    }
    
    // TODO: Replace with proper toast notification system
    // Examples: react-hot-toast, react-toastify, or custom notification component
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showNotification({ type: 'success', message, duration });
  }, [showNotification]);

  const showError = useCallback((message, duration) => {
    showNotification({ type: 'error', message, duration });
  }, [showNotification]);

  const showWarning = useCallback((message, duration) => {
    showNotification({ type: 'warning', message, duration });
  }, [showNotification]);

  const showInfo = useCallback((message, duration) => {
    showNotification({ type: 'info', message, duration });
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotification;