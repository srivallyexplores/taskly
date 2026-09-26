import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  CheckIcon, 
  ClockIcon,
  TrophyIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import taskService from '../services/taskService';

const Dashboard = () => {
  const { user } = useAuth();

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Helper function to format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    
    const dueDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate.toDateString() === today.toDateString()) {
      return `Today, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return dueDate.toLocaleDateString();
    }
  };
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    streak: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id && !user?._id) return;

      try {
        setLoading(true);
        setError(null);

        const userId = user.id || user._id;

        // Fetch user stats
        const statsResponse = await userService.getUserStats(userId);
        const userStats = statsResponse.data?.stats || {};

        // Fetch recent tasks
        const recentTasksResponse = await taskService.getUserTasks(userId, {
          page: 1,
          limit: 5,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });
        const recentTasksData = recentTasksResponse.data?.tasks || recentTasksResponse.data?.items || [];

        // Fetch upcoming tasks (tasks due soon)
        const upcomingTasksResponse = await taskService.getUserTasks(userId, {
          page: 1,
          limit: 5,
          status: 'in-progress',
          sortBy: 'due',
          sortOrder: 'asc'
        });
        const upcomingTasksData = upcomingTasksResponse.data?.tasks || upcomingTasksResponse.data?.items || [];

        // Calculate stats
        const totalTasks = (userStats.completed || 0) + (userStats.ongoing || 0) + (userStats.failed || 0);
        const completionRate = totalTasks > 0 ? Math.round(((userStats.completed || 0) / totalTasks) * 100) : 0;

        setStats({
          totalTasks,
          completedTasks: userStats.completed || 0,
          inProgressTasks: userStats.ongoing || 0,
          overdueTasks: userStats.failed || 0,
          completionRate,
          streak: userStats.streak || 0
        });

        // Format recent tasks
        const formattedRecentTasks = recentTasksData.map(task => ({
          id: task._id || task.id,
          title: task.title,
          status: task.status,
          priority: task.priority || 'medium',
          completedAt: task.status === 'completed' ? formatTimeAgo(task.updatedAt) : null,
          updatedAt: formatTimeAgo(task.updatedAt)
        }));

        // Format upcoming tasks
        const formattedUpcomingTasks = upcomingTasksData.map(task => ({
          id: task._id || task.id,
          title: task.title,
          priority: task.priority || 'medium',
          dueDate: formatDueDate(task.due)
        }));

        setRecentTasks(formattedRecentTasks);
        setUpcomingTasks(formattedUpcomingTasks);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-secondary-600 bg-secondary-100 dark:bg-secondary-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-secondary-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            Welcome back, {user?.fullname || user?.username || 'User'}!
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Here's your productivity overview for today.
          </p>
        </div>
        <Link
          to="/tasks/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <CheckIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Total Tasks
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.totalTasks}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Completed
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.completedTasks}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <ClockIcon className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                In Progress
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.inProgressTasks}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-info-100 dark:bg-info-900/20 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-info-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Streak and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center">
            <FireIcon className="w-8 h-8 mr-3" />
            <div>
              <p className="text-orange-100 text-sm font-medium">Current Streak</p>
              <p className="text-3xl font-bold">{stats.streak} days</p>
            </div>
          </div>
          <p className="text-orange-100 text-sm mt-2">Keep it up! You're on fire! 🔥</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/tasks/new"
              className="flex flex-col items-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
            >
              <PlusIcon className="w-6 h-6 text-primary-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">New Task</span>
            </Link>
            <Link
              to="/calendar"
              className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <CalendarIcon className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Calendar</span>
            </Link>
            <Link
              to="/analytics"
              className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
            >
              <ChartBarIcon className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Analytics</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
            >
              <UserIcon className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Profile</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Recent Activity
            </h3>
            <Link
              to="/tasks"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${getStatusColor(task.status)}`}></div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {task.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  {task.completedAt || task.updatedAt}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg border border-secondary-200 dark:border-secondary-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Upcoming Deadlines
            </h3>
            <Link
              to="/calendar"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View calendar
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 text-secondary-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {task.title}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {task.dueDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Overdue Tasks Alert */}
      {stats.overdueTasks > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Review and update your overdue tasks to stay on track.
              </p>
            </div>
            <Link
              to="/tasks?filter=overdue"
              className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Review
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;