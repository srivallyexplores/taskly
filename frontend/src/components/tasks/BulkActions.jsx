import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui';
import { 
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  TagIcon,
  FlagIcon,
  CalendarIcon,
  UserIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';

const BulkActions = ({ 
  selectedTasks = [], 
  onBulkAction, 
  onClearSelection,
  className = '' 
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const selectedCount = selectedTasks.length;
  
  const handleBulkAction = async (action, options = {}) => {
    setIsProcessing(true);
    try {
      await onBulkAction(action, selectedTasks, options);
    } catch (error) {
      //console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const primaryActions = [
    {
      id: 'complete',
      label: 'Complete',
      icon: CheckCircleIcon,
      color: 'bg-success-600 hover:bg-success-700 text-white',
      action: () => handleBulkAction('complete'),
    },
    {
      id: 'fail',
      label: 'Mark Failed',
      icon: XCircleIcon,
      color: 'bg-error-600 hover:bg-error-700 text-white',
      action: () => handleBulkAction('fail'),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: TrashIcon,
      color: 'bg-error-600 hover:bg-error-700 text-white',
      action: () => handleBulkAction('delete'),
      requireConfirm: true,
    },
  ];
  
  const secondaryActions = [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: DocumentDuplicateIcon,
      action: () => handleBulkAction('duplicate'),
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: ArchiveBoxIcon,
      action: () => handleBulkAction('archive'),
    },
    {
      id: 'restore',
      label: 'Restore',
      icon: ArrowPathIcon,
      action: () => handleBulkAction('restore'),
    },
    {
      id: 'change-priority',
      label: 'Change Priority',
      icon: FlagIcon,
      action: () => handleBulkAction('changePriority', { priority: 'high' }),
      hasOptions: true,
    },
    {
      id: 'add-tags',
      label: 'Add Tags',
      icon: TagIcon,
      action: () => handleBulkAction('addTags', { tags: ['urgent'] }),
      hasOptions: true,
    },
    {
      id: 'change-due-date',
      label: 'Change Due Date',
      icon: CalendarIcon,
      action: () => handleBulkAction('changeDueDate', { dueDate: new Date() }),
      hasOptions: true,
    },
    {
      id: 'assign',
      label: 'Assign To',
      icon: UserIcon,
      action: () => handleBulkAction('assign', { assignee: 'user-id' }),
      hasOptions: true,
    },
  ];
  
  if (selectedCount === 0) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}
      >
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 p-4">
          <div className="flex items-center space-x-4">
            {/* Selection Info */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            {/* Primary Actions */}
            <div className="flex items-center space-x-2">
              {primaryActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    disabled={isProcessing}
                    className={action.color}
                    leftIcon={<Icon className="w-4 h-4" />}
                  >
                    {action.label}
                  </Button>
                );
              })}
            </div>
            
            {/* More Actions Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreActions(!showMoreActions)}
                leftIcon={<EllipsisHorizontalIcon className="w-4 h-4" />}
              >
                More
              </Button>
              
              {/* More Actions Dropdown */}
              <AnimatePresence>
                {showMoreActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 py-2 z-50"
                  >
                    {secondaryActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => {
                            action.action();
                            setShowMoreActions(false);
                          }}
                          disabled={isProcessing}
                          className="w-full flex items-center px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {action.label}
                          {action.hasOptions && (
                            <span className="ml-auto text-xs text-secondary-500 dark:text-secondary-400">
                              →
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300"
            >
              Clear
            </Button>
          </div>
          
          {/* Processing Indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700"
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  Processing {selectedCount} task{selectedCount !== 1 ? 's' : ''}...
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BulkActions;