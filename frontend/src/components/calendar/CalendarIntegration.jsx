import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  PlusIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const CalendarIntegration = ({ onEventCreate, onEventUpdate, className = '' }) => {
  const [connectedCalendars, setConnectedCalendars] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Sample calendar providers
  const calendarProviders = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      color: 'bg-blue-500',
      description: 'Sync with your Google Calendar'
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      icon: '📆',
      color: 'bg-blue-600',
      description: 'Sync with Microsoft Outlook'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      color: 'bg-gray-800',
      description: 'Sync with iCloud Calendar'
    }
  ];
  
  // Sample connected calendars
  useEffect(() => {
    setConnectedCalendars([
      {
        id: 'google-primary',
        provider: 'google',
        name: 'Primary Calendar',
        email: 'user@gmail.com',
        isDefault: true,
        syncEnabled: true,
        lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        color: '#4285f4'
      },
      {
        id: 'outlook-work',
        provider: 'outlook',
        name: 'Work Calendar',
        email: 'user@company.com',
        isDefault: false,
        syncEnabled: true,
        lastSync: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        color: '#0078d4'
      }
    ]);
    
    // Sample calendar events
    setCalendarEvents([
      {
        id: 'event-1',
        title: 'Team Meeting',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        end: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
        calendar: 'google-primary',
        taskId: null,
        canCreateTask: true
      },
      {
        id: 'event-2',
        title: 'Project Review',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 25 * 60 * 60 * 1000),
        calendar: 'outlook-work',
        taskId: 'task-123',
        canCreateTask: false
      }
    ]);
  }, []);
  
  const connectCalendar = async (providerId) => {
    setIsConnecting(true);
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCalendar = {
        id: `${providerId}-${Date.now()}`,
        provider: providerId,
        name: `${calendarProviders.find(p => p.id === providerId)?.name} - New`,
        email: 'user@example.com',
        isDefault: false,
        syncEnabled: true,
        lastSync: new Date(),
        color: calendarProviders.find(p => p.id === providerId)?.color || '#666'
      };
      
      setConnectedCalendars(prev => [...prev, newCalendar]);
    } catch (error) {
      //console.error('Failed to connect calendar:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnectCalendar = async (calendarId) => {
    setConnectedCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    setCalendarEvents(prev => prev.filter(event => event.calendar !== calendarId));
  };
  
  const toggleSync = async (calendarId) => {
    setConnectedCalendars(prev =>
      prev.map(cal =>
        cal.id === calendarId
          ? { ...cal, syncEnabled: !cal.syncEnabled }
          : cal
      )
    );
  };
  
  const syncCalendar = async (calendarId) => {
    setSyncStatus(prev => ({ ...prev, [calendarId]: 'syncing' }));
    
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnectedCalendars(prev =>
        prev.map(cal =>
          cal.id === calendarId
            ? { ...cal, lastSync: new Date() }
            : cal
        )
      );
      
      setSyncStatus(prev => ({ ...prev, [calendarId]: 'success' }));
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, [calendarId]: 'error' }));
    }
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setSyncStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[calendarId];
        return newStatus;
      });
    }, 3000);
  };
  
  const createTaskFromEvent = async (event) => {
    const taskData = {
      title: event.title,
      description: `Created from calendar event: ${event.title}`,
      dueDate: event.start,
      priority: 'medium',
      tags: ['calendar', 'meeting'],
      calendarEventId: event.id
    };
    
    onEventCreate?.(taskData);
    
    // Update event to show it has a linked task
    setCalendarEvents(prev =>
      prev.map(e =>
        e.id === event.id
          ? { ...e, taskId: 'new-task-id', canCreateTask: false }
          : e
      )
    );
  };
  
  const getProviderInfo = (providerId) => {
    return calendarProviders.find(p => p.id === providerId);
  };
  
  const getSyncStatusIcon = (calendarId) => {
    const status = syncStatus[calendarId];
    
    switch (status) {
      case 'syncing':
        return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-success-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-error-500" />;
      default:
        return null;
    }
  };
  
  const formatLastSync = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl p-6 border border-secondary-200 dark:border-secondary-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Calendar Integration
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              {connectedCalendars.length} calendar{connectedCalendars.length !== 1 ? 's' : ''} connected
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
      
      {/* Connected Calendars */}
      {connectedCalendars.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Connected Calendars
          </h4>
          
          <div className="space-y-3">
            {connectedCalendars.map((calendar) => {
              const provider = getProviderInfo(calendar.provider);
              
              return (
                <motion.div
                  key={calendar.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{provider?.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          {calendar.name}
                        </h5>
                        {calendar.isDefault && (
                          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">
                        {calendar.email} • Last sync: {formatLastSync(calendar.lastSync)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getSyncStatusIcon(calendar.id)}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncCalendar(calendar.id)}
                      disabled={syncStatus[calendar.id] === 'syncing'}
                      className="p-2"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </Button>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={calendar.syncEnabled}
                        onChange={() => toggleSync(calendar.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Upcoming Events */}
      {calendarEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
            Upcoming Events
          </h4>
          
          <div className="space-y-2">
            {calendarEvents.slice(0, 3).map((event) => {
              const calendar = connectedCalendars.find(cal => cal.id === event.calendar);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border border-secondary-200 dark:border-secondary-600 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: calendar?.color }}
                    />
                    <div>
                      <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {event.title}
                      </h5>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">
                        {event.start.toLocaleString()} - {event.end.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {event.taskId ? (
                      <div className="flex items-center space-x-1 text-success-600 dark:text-success-400">
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs">Linked</span>
                      </div>
                    ) : event.canCreateTask ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => createTaskFromEvent(event)}
                        className="text-xs"
                      >
                        <PlusIcon className="w-3 h-3 mr-1" />
                        Create Task
                      </Button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Add Calendar */}
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Connect Calendar
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          {calendarProviders.map((provider) => {
            const isConnected = connectedCalendars.some(cal => cal.provider === provider.id);
            
            return (
              <motion.button
                key={provider.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => !isConnected && connectCalendar(provider.id)}
                disabled={isConnected || isConnecting}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 border-dashed transition-all duration-200
                  ${isConnected 
                    ? 'border-success-300 dark:border-success-600 bg-success-50 dark:bg-success-900/20 cursor-not-allowed'
                    : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{provider.icon}</div>
                  <div className="text-left">
                    <h5 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {provider.name}
                    </h5>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
                
                {isConnected ? (
                  <CheckCircleIcon className="w-5 h-5 text-success-500" />
                ) : isConnecting ? (
                  <ArrowPathIcon className="w-5 h-5 text-primary-500 animate-spin" />
                ) : (
                  <PlusIcon className="w-5 h-5 text-secondary-400" />
                )}
              </motion.button>
            );
          })}
        </div>
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
              Calendar Settings
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Auto-sync interval
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    How often to sync calendar events
                  </p>
                </div>
                <select className="px-3 py-2 text-sm border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100">
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    Create tasks for events
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400">
                    Automatically create tasks for calendar events
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-secondary-200 dark:bg-secondary-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              {connectedCalendars.length > 0 && (
                <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Manage Calendars
                  </p>
                  <div className="space-y-2">
                    {connectedCalendars.map((calendar) => (
                      <div key={calendar.id} className="flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                        <span className="text-sm text-secondary-900 dark:text-secondary-100">
                          {calendar.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectCalendar(calendar.id)}
                          className="text-error-600 hover:text-error-700 p-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarIntegration;