import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import offlineManager from '../../utils/offlineManager';
import offlineAPI from '../../utils/offlineAPI';

const OfflineStatus = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, items: [] });
  const [issyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateSyncStatus();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial sync status check
    updateSyncStatus();
    
    // Update sync status every 30 seconds
    const interval = setInterval(updateSyncStatus, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const updateSyncStatus = async () => {
    try {
      const status = await offlineAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      //console.error('Failed to get sync status:', error);
    }
  };
  
  const handleForceSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await offlineAPI.forceSync();
      setLastSyncTime(new Date());
      await updateSyncStatus();
    } catch (error) {
      //console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const getStatusColor = () => {
    if (!isOnline) return 'bg-error-500';
    if (syncStatus.pending > 0) return 'bg-warning-500';
    return 'bg-success-500';
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (issyncing) return 'Syncing...';
    if (syncStatus.pending > 0) return `${syncStatus.pending} pending`;
    return 'Online';
  };
  
  const getStatusIcon = () => {
    if (!isOnline) return ExclamationTriangleIcon;
    if (issyncing) return ArrowPathIcon;
    if (syncStatus.pending > 0) return ClockIcon;
    return CheckCircleIcon;
  };
  
  const StatusIcon = getStatusIcon();
  
  return (
    <div className={`relative ${className}`}>
      {/* Status Indicator */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg text-white text-sm font-medium
          transition-all duration-200 hover:shadow-md
          ${getStatusColor()}
        `}
      >
        <motion.div
          animate={issyncing ? { rotate: 360 } : {}}
          transition={issyncing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
        >
          <StatusIcon className="w-4 h-4" />
        </motion.div>
        <span>{getStatusText()}</span>
      </motion.button>
      
      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  Connection Status
                </h3>
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              </div>
              
              {/* Status Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Network Status
                  </span>
                  <div className="flex items-center space-x-2">
                    <WifiIcon className={`w-4 h-4 ${isOnline ? 'text-success-500' : 'text-error-500'}`} />
                    <span className={`text-sm font-medium ${isOnline ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                      {isOnline ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Pending Sync
                  </span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {syncStatus.pending} items
                  </span>
                </div>
                
                {lastSyncTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-secondary-400">
                      Last Sync
                    </span>
                    <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {lastSyncTime.toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Sync Actions */}
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleForceSync}
                  disabled={!isOnline || issyncing}
                  className="w-full"
                >
                  {issyncing ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Force Sync
                    </>
                  )}
                </Button>
                
                {!isOnline && (
                  <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                          Working Offline
                        </p>
                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">
                          Your changes will sync automatically when connection is restored.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pending Items */}
              {syncStatus.pending > 0 && (
                <div className="mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Pending Changes ({syncStatus.pending})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {syncStatus.items.slice(0, 5).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-warning-500 rounded-full" />
                          <span className="text-xs text-secondary-600 dark:text-secondary-400">
                            {item.action.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {syncStatus.items.length > 5 && (
                      <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
                        +{syncStatus.items.length - 5} more items
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default OfflineStatus;