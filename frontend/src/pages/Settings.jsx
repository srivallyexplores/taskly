import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserIcon,
  BellIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotification as useNotificationContext } from '../context/NotificationContext';
import NotificationItem from '../components/notifications/NotificationItem';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, THEMES } = useTheme();
  const { showSuccess, showError } = useNotificationContext();
  const { 
    notifications, 
    loading: notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification 
  } = useNotificationContext();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [loading, setLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    fullname: '',
    email: '',
    jobTitle: '',
    company: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullname: user.fullname || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Update active tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch notifications when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
  }, [activeTab, fetchNotifications]);

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Remove avatar from profile update (avatar is updated separately).
      // updateProfile persists to PUT /users/profile and updates state from
      // the server response.
      const { avatar, ...profileData } = profileForm;
      await updateProfile(profileData);

      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'language', name: 'Language', icon: GlobeAltIcon },
    { id: 'mobile', name: 'Mobile', icon: DevicePhoneMobileIcon }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullname"
                    className="input"
                    placeholder="Enter your full name"
                    value={profileForm.fullname}
                    onChange={handleProfileChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="Enter your email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    className="input"
                    placeholder="Enter your job title"
                    value={profileForm.jobTitle}
                    onChange={handleProfileChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    className="input"
                    placeholder="Enter your company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    className="input"
                    placeholder="Tell us about yourself"
                    rows="3"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Notifications List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">
                  Your Notifications
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              {notificationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <BellIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
                  <p className="text-secondary-500 dark:text-secondary-400">
                    No notifications yet
                  </p>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email notifications', description: 'Receive notifications via email' },
                  { id: 'push', label: 'Push notifications', description: 'Receive push notifications in browser' },
                  { id: 'desktop', label: 'Desktop notifications', description: 'Show desktop notifications' },
                  { id: 'mobile', label: 'Mobile notifications', description: 'Receive notifications on mobile app' }
                ].map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {notification.label}
                      </h4>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {notification.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                Theme Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(THEMES).map((themeOption) => (
                  <div
                    key={themeOption}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      theme === themeOption
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
                    }`}
                    onClick={() => setTheme(themeOption)}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-lg ${
                        themeOption === 'light' ? 'bg-white border border-secondary-200' :
                        themeOption === 'dark' ? 'bg-secondary-900 border border-secondary-700' :
                        'bg-gradient-to-br from-white to-secondary-900'
                      }`}></div>
                      <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 capitalize">
                        {themeOption}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
                Privacy Settings
              </h3>
              <div className="space-y-4">
                {[
                  { id: 'profile-visibility', label: 'Profile visibility', description: 'Make your profile visible to other users' },
                  { id: 'activity-status', label: 'Activity status', description: 'Show when you were last active' },
                  { id: 'data-collection', label: 'Data collection', description: 'Allow collection of usage data for improvements' }
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {setting.label}
                      </h4>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {setting.description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-secondary-600 dark:text-secondary-400">
              Settings for {activeTab} coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
          Settings
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-secondary-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;