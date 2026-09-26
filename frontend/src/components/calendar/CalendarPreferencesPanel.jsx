import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useCalendarPreferences } from '../../hooks/useCalendarPreferences';

const CalendarPreferencesPanel = ({ isOpen, onClose, className = '' }) => {
  const {
    preferences,
    updatePreference,
    updateNestedPreference,
    resetPreferences,
    exportPreferences,
    importPreferences,
    isLoading,
    isSaving
  } = useCalendarPreferences();

  const [activeTab, setActiveTab] = useState('general');
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'display', label: 'Display', icon: Cog6ToothIcon },
    { id: 'notifications', label: 'Notifications', icon: Cog6ToothIcon },
    { id: 'advanced', label: 'Advanced', icon: Cog6ToothIcon }
  ];

  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportFile(file);
    setImportStatus('importing');

    try {
      await importPreferences(file);
      setImportStatus('success');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all preferences to defaults? This cannot be undone.')) {
      resetPreferences();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`bg-white dark:bg-secondary-800 rounded-lg shadow-xl border border-secondary-200 dark:border-secondary-700 w-full max-w-4xl max-h-[80vh] overflow-hidden ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                Calendar Preferences
              </h2>
              {isSaving && (
                <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-full max-h-[calc(80vh-80px)]">
            {/* Sidebar */}
            <div className="w-64 bg-secondary-50 dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Import/Export Actions */}
              <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 space-y-2">
                <button
                  onClick={exportPreferences}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export Settings</span>
                </button>

                <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors cursor-pointer">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>Import Settings</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>

                {importStatus && (
                  <div className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg ${
                    importStatus === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    importStatus === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {importStatus === 'success' && <CheckIcon className="w-4 h-4" />}
                    {importStatus === 'error' && <ExclamationTriangleIcon className="w-4 h-4" />}
                    {importStatus === 'importing' && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                    <span>
                      {importStatus === 'success' && 'Settings imported'}
                      {importStatus === 'error' && 'Import failed'}
                      {importStatus === 'importing' && 'Importing...'}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {activeTab === 'general' && (
                  <GeneralPreferences 
                    preferences={preferences}
                    updatePreference={updatePreference}
                    updateNestedPreference={updateNestedPreference}
                  />
                )}
                
                {activeTab === 'display' && (
                  <DisplayPreferences 
                    preferences={preferences}
                    updatePreference={updatePreference}
                    updateNestedPreference={updateNestedPreference}
                  />
                )}
                
                {activeTab === 'notifications' && (
                  <NotificationPreferences 
                    preferences={preferences}
                    updatePreference={updatePreference}
                    updateNestedPreference={updateNestedPreference}
                  />
                )}
                
                {activeTab === 'advanced' && (
                  <AdvancedPreferences 
                    preferences={preferences}
                    updatePreference={updatePreference}
                    updateNestedPreference={updateNestedPreference}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// General Preferences Tab
const GeneralPreferences = ({ preferences, updatePreference, updateNestedPreference }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
        General Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Default View
          </label>
          <select
            value={preferences.defaultView}
            onChange={(e) => updatePreference('defaultView', e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
            <option value="agenda">Agenda</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Start of Week
          </label>
          <select
            value={preferences.startOfWeek}
            onChange={(e) => updatePreference('startOfWeek', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Time Format
          </label>
          <select
            value={preferences.timeFormat}
            onChange={(e) => updatePreference('timeFormat', e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="12h">12 Hour (AM/PM)</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Date Format
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => updatePreference('dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>

    <div>
      <h4 className="text-md font-medium text-secondary-900 dark:text-secondary-100 mb-3">
        Working Hours
      </h4>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="workingHoursEnabled"
            checked={preferences.workingHours.enabled}
            onChange={(e) => updateNestedPreference('workingHours.enabled', e.target.checked)}
            className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="workingHoursEnabled" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
            Enable working hours
          </label>
        </div>

        {preferences.workingHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={preferences.workingHours.start}
                onChange={(e) => updateNestedPreference('workingHours.start', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={preferences.workingHours.end}
                onChange={(e) => updateNestedPreference('workingHours.end', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Display Preferences Tab
const DisplayPreferences = ({ preferences, updatePreference }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
        Display Settings
      </h3>
      
      <div className="space-y-4">
        {[
          { key: 'showWeekends', label: 'Show weekends' },
          { key: 'showWeekNumbers', label: 'Show week numbers' },
          { key: 'compactMode', label: 'Compact mode' },
          { key: 'showTaskCount', label: 'Show task count' },
          { key: 'showTaskPriority', label: 'Show task priority' },
          { key: 'showTaskStatus', label: 'Show task status' },
          { key: 'showHolidays', label: 'Show holidays' }
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center">
            <input
              type="checkbox"
              id={key}
              checked={preferences[key]}
              onChange={(e) => updatePreference(key, e.target.checked)}
              className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={key} className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Theme
      </label>
      <select
        value={preferences.theme}
        onChange={(e) => updatePreference('theme', e.target.value)}
        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Font Size
      </label>
      <select
        value={preferences.fontSize}
        onChange={(e) => updatePreference('fontSize', e.target.value)}
        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>
  </div>
);

// Notification Preferences Tab
const NotificationPreferences = ({ preferences, updatePreference, updateNestedPreference }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
        Notification Settings
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableNotifications"
            checked={preferences.enableNotifications}
            onChange={(e) => updatePreference('enableNotifications', e.target.checked)}
            className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="enableNotifications" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
            Enable notifications
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="notificationSound"
            checked={preferences.notificationSound}
            onChange={(e) => updatePreference('notificationSound', e.target.checked)}
            className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="notificationSound" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
            Play notification sounds
          </label>
        </div>
      </div>
    </div>

    <div>
      <h4 className="text-md font-medium text-secondary-900 dark:text-secondary-100 mb-3">
        Quiet Hours
      </h4>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="quietHoursEnabled"
            checked={preferences.quietHours.enabled}
            onChange={(e) => updateNestedPreference('quietHours.enabled', e.target.checked)}
            className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="quietHoursEnabled" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
            Enable quiet hours
          </label>
        </div>

        {preferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updateNestedPreference('quietHours.start', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary-600 dark:text-secondary-400 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => updateNestedPreference('quietHours.end', e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Advanced Preferences Tab
const AdvancedPreferences = ({ preferences, updatePreference }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
        Advanced Settings
      </h3>
      
      <div className="space-y-4">
        {[
          { key: 'enableKeyboardShortcuts', label: 'Enable keyboard shortcuts' },
          { key: 'enableDragAndDrop', label: 'Enable drag and drop' },
          { key: 'enableQuickEdit', label: 'Enable quick edit' },
          { key: 'autoSave', label: 'Auto-save preferences' },
          { key: 'syncAcrossDevices', label: 'Sync across devices' },
          { key: 'saveFilters', label: 'Save filter state' },
          { key: 'lazyLoading', label: 'Enable lazy loading' }
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center">
            <input
              type="checkbox"
              id={key}
              checked={preferences[key]}
              onChange={(e) => updatePreference(key, e.target.checked)}
              className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={key} className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Cache Size (number of months)
      </label>
      <input
        type="number"
        min="10"
        max="100"
        value={preferences.cacheSize}
        onChange={(e) => updatePreference('cacheSize', parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
        Prefetch Distance (months ahead)
      </label>
      <input
        type="number"
        min="1"
        max="6"
        value={preferences.prefetchDistance}
        onChange={(e) => updatePreference('prefetchDistance', parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  </div>
);

export default CalendarPreferencesPanel;