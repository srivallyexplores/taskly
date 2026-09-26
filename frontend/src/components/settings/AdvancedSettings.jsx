import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';

const AdvancedSettings = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      language: 'en',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      startOfWeek: 'monday'
    },
    appearance: {
      theme: 'system',
      colorScheme: 'blue',
      fontSize: 'medium',
      compactMode: false,
      animations: true,
      highContrast: false
    },
    notifications: {
      email: {
        taskReminders: true,
        dailyDigest: true,
        weeklyReport: false,
        teamUpdates: true,
        achievements: true
      },
      push: {
        taskReminders: true,
        mentions: true,
        deadlines: true,
        teamUpdates: false
      },
      inApp: {
        sound: true,
        desktop: true,
        frequency: 'normal'
      }
    },
    privacy: {
      profileVisibility: 'team',
      activityVisibility: 'private',
      searchable: true,
      analyticsOptOut: false,
      dataCollection: true
    },
    integrations: {
      calendar: {
        google: { connected: true, syncEnabled: true },
        outlook: { connected: false, syncEnabled: false }
      },
      storage: {
        dropbox: { connected: false },
        googleDrive: { connected: true },
        onedrive: { connected: false }
      }
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
      deviceTrust: true
    }
  });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const settingSections = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrations', icon: CloudIcon },
    { id: 'security', name: 'Security', icon: KeyIcon }
  ];
  
  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };
  
  const updateNestedSetting = (section, category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [category]: {
          ...prev[section][category],
          [key]: value
        }
      }
    }));
  };
  
  const handleExportData = async () => {
    setExportLoading(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const exportData = {
      profile: { /* user profile data */ },
      tasks: { /* user tasks */ },
      projects: { /* user projects */ },
      settings: settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportLoading(false);
  };
  
  const handleDeleteAccount = () => {
    // Handle account deletion
    //console.log('Account deletion requested');
    setShowDeleteConfirm(false);
  };  

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Language
        </label>
        <select
          value={settings.general.language}
          onChange={(e) => updateSetting('general', 'language', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Timezone
        </label>
        <select
          value={settings.general.timezone}
          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Date Format
          </label>
          <select
            value={settings.general.dateFormat}
            onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Time Format
          </label>
          <select
            value={settings.general.timeFormat}
            onChange={(e) => updateSetting('general', 'timeFormat', e.target.value)}
            className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
          >
            <option value="12h">12 Hour</option>
            <option value="24h">24 Hour</option>
          </select>
        </div>
      </div>
    </div>
  );
  
  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'system'].map((theme) => (
            <button
              key={theme}
              onClick={() => updateSetting('appearance', 'theme', theme)}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.appearance.theme === theme
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
              }`}
            >
              <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                {theme}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
          Color Scheme
        </label>
        <div className="grid grid-cols-6 gap-2">
          {['blue', 'green', 'purple', 'orange', 'red', 'pink'].map((color) => (
            <button
              key={color}
              onClick={() => updateSetting('appearance', 'colorScheme', color)}
              className={`w-12 h-12 rounded-lg border-2 ${
                settings.appearance.colorScheme === color
                  ? 'border-secondary-900 dark:border-secondary-100'
                  : 'border-secondary-200 dark:border-secondary-700'
              }`}
              style={{
                backgroundColor: {
                  blue: '#3b82f6',
                  green: '#10b981',
                  purple: '#8b5cf6',
                  orange: '#f59e0b',
                  red: '#ef4444',
                  pink: '#ec4899'
                }[color]
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Compact Mode
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Reduce spacing and padding
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.appearance.compactMode}
              onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Animations
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Enable smooth transitions and animations
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.appearance.animations}
              onChange={(e) => updateSetting('appearance', 'animations', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );  

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-4">
          Email Notifications
        </h4>
        <div className="space-y-3">
          {Object.entries(settings.notifications.email).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-secondary-900 dark:text-secondary-100 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateNestedSetting('notifications', 'email', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-4">
          Push Notifications
        </h4>
        <div className="space-y-3">
          {Object.entries(settings.notifications.push).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-secondary-900 dark:text-secondary-100 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateNestedSetting('notifications', 'push', key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Profile Visibility
        </label>
        <select
          value={settings.privacy.profileVisibility}
          onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
        >
          <option value="public">Public</option>
          <option value="team">Team Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Searchable Profile
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Allow others to find you in search
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.privacy.searchable}
              onChange={(e) => updateSetting('privacy', 'searchable', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Analytics Opt-out
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              Disable usage analytics collection
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.privacy.analyticsOptOut}
              onChange={(e) => updateSetting('privacy', 'analyticsOptOut', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-secondary-200 dark:bg-secondary-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
  
  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            Two-Factor Authentication
          </div>
          <div className="text-xs text-secondary-600 dark:text-secondary-400">
            Add an extra layer of security to your account
          </div>
        </div>
        <Button
          variant={settings.security.twoFactorEnabled ? "ghost" : "primary"}
          size="sm"
          onClick={() => updateSetting('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
        >
          {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'}
        </Button>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
          Session Timeout (minutes)
        </label>
        <select
          value={settings.security.sessionTimeout}
          onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={240}>4 hours</option>
          <option value={480}>8 hours</option>
        </select>
      </div>
    </div>
  ); 
 
  const renderDataManagement = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Data Export & Backup
        </h4>
        <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                Export Your Data
              </div>
              <div className="text-xs text-secondary-600 dark:text-secondary-400">
                Download all your tasks, projects, and settings
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportData}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              )}
              {exportLoading ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold text-error-600 dark:text-error-400 mb-4">
          Danger Zone
        </h4>
        <div className="p-4 border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-error-800 dark:text-error-200">
                Delete Account
              </div>
              <div className="text-xs text-error-600 dark:text-error-400">
                Permanently delete your account and all data
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-error-600 hover:text-error-700 border-error-300 hover:border-error-400"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 overflow-hidden ${className}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
              Settings
            </h2>
            <nav className="space-y-1">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                      ${activeSection === section.id
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 hover:text-secondary-900 dark:hover:text-secondary-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'general' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    General Settings
                  </h3>
                  {renderGeneralSettings()}
                </div>
              )}
              
              {activeSection === 'appearance' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    Appearance & Theme
                  </h3>
                  {renderAppearanceSettings()}
                </div>
              )}
              
              {activeSection === 'notifications' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    Notification Preferences
                  </h3>
                  {renderNotificationSettings()}
                </div>
              )}
              
              {activeSection === 'privacy' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    Privacy & Visibility
                  </h3>
                  {renderPrivacySettings()}
                </div>
              )}
              
              {activeSection === 'integrations' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    Integrations & Connected Apps
                  </h3>
                  <div className="text-center py-8">
                    <CloudIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                    <p className="text-secondary-500 dark:text-secondary-400">
                      Integration settings coming soon
                    </p>
                  </div>
                </div>
              )}
              
              {activeSection === 'security' && (
                <div>
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-6">
                    Security & Authentication
                  </h3>
                  {renderSecuritySettings()}
                  <div className="mt-8">
                    {renderDataManagement()}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700"
            >
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-error-100 dark:bg-error-900/20 flex items-center justify-center">
                    <TrashIcon className="w-5 h-5 text-error-600 dark:text-error-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Delete Account
                  </h3>
                </div>
                
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, including tasks, projects, and settings.
                </p>
                
                <div className="flex space-x-3">
                  <Button
                    variant="ghost"
                    onClick={handleDeleteAccount}
                    className="flex-1 text-error-600 hover:text-error-700 border-error-300 hover:border-error-400"
                  >
                    Yes, Delete Account
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSettings;