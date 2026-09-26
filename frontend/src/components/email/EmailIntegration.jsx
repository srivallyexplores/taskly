import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  InboxIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const EmailIntegration = ({ onTaskCreate, className = '' }) => {
  const [emailAddress, setEmailAddress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailTasks, setEmailTasks] = useState([]);
  const [emailSettings, setEmailSettings] = useState({
    autoCreate: true,
    defaultPriority: 'medium',
    defaultProject: '',
    parseSubject: true,
    requireConfirmation: false
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Sample email-created tasks
  useEffect(() => {
    setEmailTasks([
      {
        id: 'email-task-1',
        title: 'Review quarterly budget',
        description: 'Please review the Q4 budget proposal and provide feedback by Friday.',
        sender: 'finance@company.com',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        priority: 'high',
        status: 'pending',
        originalSubject: 'URGENT: Review quarterly budget',
        emailId: 'email-123'
      },
      {
        id: 'email-task-2',
        title: 'Schedule team meeting',
        description: 'Can we schedule a team meeting for next week to discuss the new project requirements?',
        sender: 'sarah@company.com',
        receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'created',
        originalSubject: 'Team meeting for new project',
        emailId: 'email-124'
      },
      {
        id: 'email-task-3',
        title: 'Update documentation',
        description: 'The API documentation needs to be updated with the latest changes from version 2.1.',
        sender: 'dev-team@company.com',
        receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        priority: 'low',
        status: 'created',
        originalSubject: 'Documentation update needed',
        emailId: 'email-125'
      }
    ]);
    
    // Generate unique email address
    setEmailAddress(`tasks-${Math.random().toString(36).substr(2, 8)}@taskflow.app`);
  }, []);
  
  const generateNewEmailAddress = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAddress = `tasks-${Math.random().toString(36).substr(2, 8)}@taskflow.app`;
    setEmailAddress(newAddress);
    setIsGenerating(false);
  };
  
  const copyEmailAddress = () => {
    navigator.clipboard.writeText(emailAddress);
    // Show toast notification
  };
  
  const approveTask = (taskId) => {
    const task = emailTasks.find(t => t.id === taskId);
    if (task) {
      onTaskCreate?.({
        title: task.title,
        description: task.description,
        priority: task.priority,
        source: 'email',
        emailId: task.emailId
      });
      
      setEmailTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: 'created' } : t
        )
      );
    }
  };
  
  const rejectTask = (taskId) => {
    setEmailTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: 'rejected' } : t
      )
    );
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-warning-600 dark:text-warning-400 bg-warning-100 dark:bg-warning-900/20';
      case 'created':
        return 'text-success-600 dark:text-success-400 bg-success-100 dark:bg-success-900/20';
      case 'rejected':
        return 'text-error-600 dark:text-error-400 bg-error-100 dark:bg-error-900/20';
      default:
        return 'text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return ClockIcon;
      case 'created':
        return CheckCircleIcon;
      case 'rejected':
        return ExclamationTriangleIcon;
      default:
        return InboxIcon;
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-error-600 dark:text-error-400';
      case 'medium':
        return 'text-warning-600 dark:text-warning-400';
      case 'low':
        return 'text-success-600 dark:text-success-400';
      default:
        return 'text-secondary-600 dark:text-secondary-400';
    }
  };
  
  const pendingTasks = emailTasks.filter(task => task.status === 'pending');
  const processedTasks = emailTasks.filter(task => task.status !== 'pending');
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <EnvelopeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Email Integration
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Create tasks by sending emails
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Email Address */}
      <div className="mb-6 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            Your Task Email Address
          </h4>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyEmailAddress}
              className="text-xs"
            >
              <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={generateNewEmailAddress}
              disabled={isGenerating}
              className="text-xs"
            >
              {isGenerating ? 'Generating...' : 'New Address'}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-600">
          <EnvelopeIcon className="w-4 h-4 text-secondary-400" />
          <code className="flex-1 text-sm font-mono text-secondary-900 dark:text-secondary-100">
            {emailAddress}
          </code>
        </div>
        
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
          Send emails to this address to automatically create tasks. The subject line becomes the task title.
        </p>
      </div>
      
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Pending Approval ({pendingTasks.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pendingTasks.forEach(task => approveTask(task.id))}
              className="text-xs"
            >
              Approve All
            </Button>
          </div>
          
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/10 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {task.title}
                        </h5>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityColor(task.priority)} bg-current bg-opacity-10`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                        {task.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-secondary-500 dark:text-secondary-400">
                        <span>From: {task.sender}</span>
                        <span>Subject: {task.originalSubject}</span>
                        <span>{formatTimestamp(task.receivedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => approveTask(task.id)}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Create Task
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rejectTask(task.id)}
                      className="text-error-600 hover:text-error-700"
                    >
                      Reject
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Recent Email Tasks */}
      {processedTasks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Recent Email Tasks
          </h4>
          
          <div className="space-y-2">
            {processedTasks.slice(0, 5).map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              const statusColor = getStatusColor(task.status);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${statusColor}`}>
                      <StatusIcon className="w-3 h-3" />
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {task.title}
                      </h5>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400">
                        From {task.sender} • {formatTimestamp(task.receivedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${statusColor}`}>
                      {task.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Usage Instructions */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How to use Email Integration
        </h4>
        <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
          <li>• Send emails to your unique task address</li>
          <li>• Subject line becomes the task title</li>
          <li>• Email body becomes the task description</li>
          <li>• Use keywords like "URGENT" or "HIGH" for priority</li>
          <li>• Tasks require approval unless auto-create is enabled</li>
        </ul>
      </div>
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700"
          >
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-4">
              Email Settings
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Auto-create tasks
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    Automatically create tasks without approval
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSettings.autoCreate}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, autoCreate: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Parse subject for priority
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    Detect priority keywords in subject line
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailSettings.parseSubject}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, parseSubject: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  Default Priority
                </span>
                <select
                  value={emailSettings.defaultPriority}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, defaultPriority: e.target.value }))}
                  className="px-3 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={generateNewEmailAddress}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Generate New Email Address
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailIntegration;