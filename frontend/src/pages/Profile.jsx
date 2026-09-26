import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon, 
  CameraIcon, 
  PencilIcon, 
  KeyIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CalendarIcon,
  FireIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import userService from '../services/userService'
import taskService from '../services/taskService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DocumentHead from '../components/common/DocumentHead'
import SafeImage from '../components/common/SafeImage'

const Profile = () => {
  const { user: currentUser, isAuthenticated, logout, updateProfile } = useAuth()
  const navigate = useNavigate()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({})
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    fullname: '',
    email: '',
    bio: '',
    location: '',
    company: '',
    role: '',
    website: '',
    phone: ''
  })
  
  // Avatar change state
  const [isChangingAvatar, setIsChangingAvatar] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [avatarOptions] = useState([
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
  ])
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const userId = currentUser?.id || currentUser?._id

  // Initialize form data when user data is available
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        fullname: currentUser.fullname || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        company: currentUser.company || '',
        role: currentUser.role || '',
        website: currentUser.website || '',
        phone: currentUser.phone || ''
      })
      setSelectedAvatar(currentUser.avatar || '/img/placeholder-user.png')
    }
  }, [currentUser])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !currentUser || !isAuthenticated) return

      try {
        setLoading(true)
        setError(null)

        // Fetch user stats
        const statsResponse = await userService.getUserStats(userId)
        setStats(statsResponse.data?.stats || {})

        // Fetch recent tasks
        const tasksResponse = await taskService.getUserTasks(userId, {
          page: 1,
          limit: 5,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        })
        setRecentTasks(tasksResponse.data.tasks || tasksResponse.data.items || tasksResponse.data || [])

      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId, currentUser, isAuthenticated])

  // Form handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await updateProfile(profileForm) // Persist and update context from server
      setIsEditingProfile(false)
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarChange = async (newAvatar) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateProfile({ avatar: newAvatar }) // Persist and update context
      setSelectedAvatar(newAvatar)
      setIsChangingAvatar(false)
      setSuccessMessage('Avatar updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      setIsSubmitting(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setIsSubmitting(false)
      return
    }

    try {
      await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      setIsChangingPassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSuccessMessage('Password changed successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId)
        logout()
        navigate('/')
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown'
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return date.toLocaleDateString()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }



  if (!currentUser) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">Profile</h1>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4">Please log in to view your profile.</p>
          <Link to="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading profile..." />
      </div>
    )
  }

  return (
    <>
      <DocumentHead
        title={`${currentUser.fullname || currentUser.username || 'User'} - Profile | Taskly`}
        description={`View your profile, tasks, and productivity statistics.`}
        keywords="user profile, tasks, productivity, statistics"
      />

      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 z-50 bg-success-500 text-white px-6 py-3 rounded-lg shadow-lg"
            >
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 mr-2" />
                {successMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <XMarkIcon className="w-5 h-5 mr-2" />
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 hover:bg-red-600 rounded p-1"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="relative">
                  <SafeImage
                    src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    fallbackSrc="https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                    alt="Profile avatar"
                  />
                  <button
                    onClick={() => setIsChangingAvatar(true)}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <CameraIcon className="w-8 h-8 text-white" />
                  </button>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-success-500 rounded-full p-2">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {currentUser.fullname || currentUser.username || 'User'}
                </h1>
                <p className="text-primary-100 text-lg mb-4">
                  {currentUser.role || 'Member'} {currentUser.company && `at ${currentUser.company}`}
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-primary-100">
                  <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Joined {new Date(currentUser.created_at || currentUser.createdAt).toLocaleDateString()}
                  </div>
                  {currentUser.location && (
                    <div className="flex items-center">
                      <span className="w-4 h-4 mr-2">📍</span>
                      {currentUser.location}
                    </div>
                  )}
                </div>
                {currentUser.bio && (
                  <p className="text-primary-100 mt-4 max-w-2xl">
                    {currentUser.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="btn btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="btn btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <KeyIcon className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
                  <TrophyIcon className="w-6 h-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Completed Tasks
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stats.completed || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-info-100 dark:bg-info-900/20 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-info-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Active Tasks
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stats.ongoing || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
                  <FireIcon className="w-6 h-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Current Streak
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stats.streak || 0} days
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <StarIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    Success Rate
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {stats.completionRate || 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    Recent Activity
                  </h3>
                  <Link
                    to="/tasks"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View all tasks
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentTasks.length > 0 ? (
                    recentTasks.map((task) => (
                      <div key={task._id || task.id} className="flex items-center p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                        <div className={`w-3 h-3 rounded-full mr-4 ${
                          task.status === 'completed' ? 'bg-success-500' :
                          task.status === 'in-progress' ? 'bg-info-500' : 'bg-warning-500'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {task.title}
                          </h4>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {formatTimeAgo(task.updatedAt)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {task.priority || 'medium'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ChartBarIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                      <p className="text-secondary-500 dark:text-secondary-400">
                        No recent activity. Start creating tasks to see your progress!
                      </p>
                      <Link
                        to="/tasks/new"
                        className="btn btn-primary mt-4"
                      >
                        Create Your First Task
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Settings */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/tasks/new"
                    className="flex items-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
                  >
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                      <PencilIcon className="w-4 h-4 text-primary-600" />
                    </div>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      Create New Task
                    </span>
                  </Link>
                  <Link
                    to="/analytics"
                    className="flex items-center p-3 bg-success-50 dark:bg-success-900/20 rounded-lg hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors group"
                  >
                    <div className="p-2 bg-success-100 dark:bg-success-900/40 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                      <ChartBarIcon className="w-4 h-4 text-success-600" />
                    </div>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      View Analytics
                    </span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center p-3 bg-info-50 dark:bg-info-900/20 rounded-lg hover:bg-info-100 dark:hover:bg-info-900/30 transition-colors group"
                  >
                    <div className="p-2 bg-info-100 dark:bg-info-900/40 rounded-lg mr-3 group-hover:scale-110 transition-transform">
                      <Cog6ToothIcon className="w-4 h-4 text-info-600" />
                    </div>
                    <span className="font-medium text-secondary-900 dark:text-secondary-100">
                      Settings
                    </span>
                  </Link>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-6 border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                  Danger Zone
                </h3>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-danger w-full"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditingProfile(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    Edit Profile
                  </h3>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.fullname}
                        onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Role/Job Title
                      </label>
                      <input
                        type="text"
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your role"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profileForm.company}
                        onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your company"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={profileForm.website}
                        onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                        className="input w-full"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="input w-full h-24 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Avatar Modal */}
      <AnimatePresence>
        {isChangingAvatar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsChangingAvatar(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    Change Avatar
                  </h3>
                  <button
                    onClick={() => setIsChangingAvatar(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center mb-6">
                  <SafeImage
                    src={selectedAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    fallbackSrc="https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-secondary-200 dark:border-secondary-600"
                    alt="Selected avatar"
                  />
                </div>

                {/* Upload Custom Avatar */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Upload Custom Avatar
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Show preview immediately
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setSelectedAvatar(reader.result);
                          };
                          reader.readAsDataURL(file);
                          
                          // Store file for upload
                          e.target.uploadFile = file;
                        }
                      }}
                      className="hidden"
                      id="avatar-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <PhotoIcon className="w-12 h-12 text-secondary-400 mb-2" />
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary-200 dark:border-secondary-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-secondary-800 text-secondary-500">
                      Or choose from presets
                    </span>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
                    Select Preset Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selectedAvatar === avatar
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-secondary-200 dark:border-secondary-600 hover:border-primary-300'
                        }`}
                      >
                        <SafeImage
                          src={avatar}
                          fallbackSrc="https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                          className="w-full h-16 object-cover"
                          alt={`Avatar option ${index + 1}`}
                        />
                        {selectedAvatar === avatar && (
                          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                            <CheckIcon className="w-6 h-6 text-primary-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsChangingAvatar(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      //console.log('📤 [Profile] ========== AVATAR UPLOAD STARTED ==========');
                      const fileInput = document.getElementById('avatar-upload');
                      const file = fileInput?.uploadFile;
                      
                
                      
                      // If a file was selected, upload it
                      if (file) {
                        console.log('📤 [Profile] File details:', {
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
                          lastModified: new Date(file.lastModified).toISOString()
                        });
                        
                        setIsSubmitting(true);
                        setError(null);
                        try {

                          const formData = new FormData();
                          formData.append('avatar', file);
                          

                          // for (let pair of formData.entries()) {
                          //   console.log('  -', pair[0], ':', pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]);
                          // }
                          
                          // Upload to Cloudinary
                          
                          const uploadData = await userService.uploadAvatarFile(formData);
                          
                          // console.log('📤 [Profile] Upload response:', {
                          //   success: uploadData.success,
                          //   hasData: !!uploadData.data,
                          //   hasAvatarUrl: !!uploadData.data?.avatarUrl,
                          //   avatarUrl: uploadData.data?.avatarUrl,
                          //   error: uploadData.error
                          // });
                          
                          if (uploadData.success && uploadData.data?.avatarUrl) {
                            const newAvatarUrl = uploadData.data.avatarUrl;

                            // Update local state immediately
                            setSelectedAvatar(newAvatarUrl);

                            // Persist the new avatar URL and update context from server
                            await updateProfile({ avatar: newAvatarUrl });

                            setIsChangingAvatar(false);
                            setSuccessMessage('Avatar uploaded successfully!');
                            setTimeout(() => setSuccessMessage(''), 3000);
                          } else {
                            throw new Error(uploadData.error?.message || 'Upload failed');
                          }
                        } catch (err) {
                          // Friendly message when Cloudinary is not configured (503)
                          if (err.status === 503 || err.code === 'CLOUDINARY_NOT_CONFIGURED') {
                            setError('Image uploads are not available right now. Please try a preset avatar instead.');
                          } else {
                            setError(err.message || 'Failed to upload avatar');
                          }
                        } finally {
                          setIsSubmitting(false)
                        }
                      } else {
                        console.log('[Profile] No file selected, using preset avatar');
                        // No file selected, just update with preset avatar
                        handleAvatarChange(selectedAvatar);
                      }
                    }}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Avatar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isChangingPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsChangingPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-secondary-800 rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
                    Change Password
                  </h3>
                  <button
                    onClick={() => setIsChangingPassword(false)}
                    className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="input w-full pr-10"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                      >
                        {showPasswords.current ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="input w-full pr-10"
                        placeholder="Enter new password"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                      >
                        {showPasswords.new ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="input w-full pr-10"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                      >
                        {showPasswords.confirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsChangingPassword(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Profile