import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  CameraIcon,
  PencilIcon,
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  CheckCircleIcon,
  ShareIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';

const UserProfile = ({ userId, isOwnProfile = true, className = '' }) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If no userId provided, use current user
        const targetUserId = userId || currentUser?.id || currentUser?._id;
        
        if (!targetUserId) {
          setError('No user ID provided');
          return;
        }

        // If viewing own profile, use current user data
        if (isOwnProfile && currentUser) {
          // Get user stats
          const statsResponse = await userService.getUserStats(targetUserId);
          const stats = statsResponse.data?.stats || {};
          
          setUser({
            id: currentUser.id || currentUser._id,
            name: currentUser.fullname || currentUser.username,
            email: currentUser.email,
            avatar: currentUser.avatar,
            title: currentUser.role || 'User',
            company: currentUser.company || '',
            location: currentUser.location || '',
            timezone: currentUser.timezone || '',
            joinDate: new Date(currentUser.created_at || currentUser.createdAt),
            bio: currentUser.bio || '',
            skills: currentUser.skills || [],
            socialLinks: currentUser.socialLinks || {},
            stats: {
              tasksCompleted: stats.completed || 0,
              projectsLed: stats.projects || 0,
              teamMembers: stats.teamMembers || 0,
              currentStreak: stats.streak || 0,
              longestStreak: stats.longestStreak || 0,
              totalXP: stats.totalXP || 0,
              level: stats.level || 1,
              achievements: stats.achievements || 0
            },
            recentActivity: stats.recentActivity || [],
            achievements: stats.achievements || [],
            productivityStats: stats.productivityStats || {
              weeklyData: [],
              monthlyTrend: []
            }
          });
        } else {
          // Fetch other user's data
          const userResponse = await userService.getUser(targetUserId);
          const userData = userResponse.data;
          
          setUser({
            id: userData.id || userData._id,
            name: userData.fullname || userData.username,
            email: userData.email,
            avatar: userData.avatar,
            title: userData.role || 'User',
            company: userData.company || '',
            location: userData.location || '',
            timezone: userData.timezone || '',
            joinDate: new Date(userData.created_at || userData.createdAt),
            bio: userData.bio || '',
            skills: userData.skills || [],
            socialLinks: userData.socialLinks || {},
            stats: userData.stats || {},
            recentActivity: userData.recentActivity || [],
            achievements: userData.achievements || [],
            productivityStats: userData.productivityStats || {
              weeklyData: [],
              monthlyTrend: []
            }
          });
        }
        
        setEditForm(user);
      } catch (err) {
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    try {
      // Update user data via API
      await userService.updateUser(user.id, editForm);
      setUser(editForm);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update user data');
    }
  };
  
  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };
  
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditForm(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-400 to-gray-600';
      case 'uncommon':
        return 'from-green-400 to-green-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-purple-400 to-purple-600';
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return CheckCircleIcon;
      case 'achievement_unlocked':
        return TrophyIcon;
      case 'project_created':
        return StarIcon;
      case 'team_joined':
        return UserIcon;
      default:
        return ClockIcon;
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 overflow-hidden ${className}`}>
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-purple-600" />
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4 sm:mb-0">
              <div className="relative">
                <img
                  src={isEditing ? editForm.avatar : user.avatar}
                  alt={user.name}
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-secondary-800 bg-white dark:bg-secondary-800"
                />
                {isEditing && isOwnProfile && (
                  <label className="absolute bottom-2 right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                    <CameraIcon className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none text-secondary-900 dark:text-secondary-100"
                  />
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="text-lg bg-transparent border-b border-secondary-300 dark:border-secondary-600 focus:outline-none text-secondary-600 dark:text-secondary-400"
                  />
                  <input
                    type="text"
                    value={editForm.company}
                    onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-transparent border-b border-secondary-300 dark:border-secondary-600 focus:outline-none text-secondary-600 dark:text-secondary-400"
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-1">
                    {user.name}
                  </h1>
                  <p className="text-lg text-secondary-600 dark:text-secondary-400 mb-1">
                    {user.title}
                  </p>
                  <p className="text-secondary-500 dark:text-secondary-400">
                    {user.company} • {user.location}
                  </p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              {isOwnProfile ? (
                isEditing ? (
                  <>
                    <Button variant="primary" size="sm" onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" size="sm" onClick={handleEdit}>
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Cog6ToothIcon className="w-4 h-4" />
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Button variant="primary" size="sm">
                    Connect
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ShareIcon className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Bio */}
          {isEditing ? (
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full mt-4 p-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="mt-4 text-secondary-700 dark:text-secondary-300 leading-relaxed">
              {user.bio}
            </p>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {user.stats.tasksCompleted}
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Tasks Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {user.stats.level}
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Level
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {user.stats.currentStreak}
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Current Streak
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {user.stats.achievements}
              </div>
              <div className="text-sm text-secondary-600 dark:text-secondary-400">
                Achievements
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-secondary-200 dark:border-secondary-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'activity', name: 'Activity', icon: ClockIcon },
            { id: 'achievements', name: 'Achievements', icon: TrophyIcon },
            { id: 'stats', name: 'Statistics', icon: ChartBarIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Skills */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                    Skills & Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-300 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                {/* Recent Achievements */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-3">
                    Recent Achievements
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {user.achievements.slice(0, 3).map((achievement, index) => {
                      const Icon = achievement.icon;
                      return (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg"
                        >
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center mb-3`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
                            {achievement.name}
                          </h4>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {achievement.description}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {user.recentActivity.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                            {activity.title}
                          </p>
                          <p className="text-xs text-secondary-500 dark:text-secondary-400">
                            {formatTimestamp(activity.timestamp)}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          +{activity.xp} XP
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                  All Achievements ({user.achievements.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {user.achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getRarityColor(achievement.rarity)} flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                            {achievement.rarity}
                          </span>
                          <span className="text-xs text-secondary-500 dark:text-secondary-400">
                            {achievement.unlockedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Weekly Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                    Weekly Activity
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {user.productivityStats.weeklyData.map((day, index) => (
                      <div key={day.day} className="text-center">
                        <div className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">
                          {day.day}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.tasks / 15) * 100}px` }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-primary-500 rounded-t mx-auto"
                          style={{ width: '20px', minHeight: '4px' }}
                        />
                        <div className="text-xs font-medium text-secondary-900 dark:text-secondary-100 mt-2">
                          {day.tasks}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Key Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                    Key Metrics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg text-center">
                      <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {user.stats.totalXP.toLocaleString()}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        Total XP
                      </div>
                    </div>
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg text-center">
                      <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {user.stats.projectsLed}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        Projects Led
                      </div>
                    </div>
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg text-center">
                      <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {user.stats.teamMembers}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        Team Members
                      </div>
                    </div>
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg text-center">
                      <div className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        {user.stats.longestStreak}
                      </div>
                      <div className="text-sm text-secondary-600 dark:text-secondary-400">
                        Longest Streak
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserProfile;