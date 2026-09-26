import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import taskService from '../services/taskService';

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([]);
  const [productivityData, setProductivityData] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user?.id && !user?._id) return;

      try {
        setLoading(true);
        setError(null);

        const userId = user.id || user._id;

        // Fetch user stats
        const statsResponse = await userService.getUserStats(userId);
        const userStats = statsResponse.data?.stats || {};

        // Fetch recent tasks for activity
        const recentTasksResponse = await taskService.getUserTasks(userId, {
          page: 1,
          limit: 10,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        });
        const recentTasks = recentTasksResponse.data?.tasks || recentTasksResponse.data?.items || [];

        // Calculate stats
        const totalTasks = (userStats.completed || 0) + (userStats.ongoing || 0) + (userStats.failed || 0);
        const completionRate = totalTasks > 0 ? Math.round(((userStats.completed || 0) / totalTasks) * 100) : 0;
        const avgCompletionTime = userStats.avgCompletionTime || 0;

        // Format stats for display
        const formattedStats = [
          {
            title: 'Tasks Completed',
            value: (userStats.completed || 0).toString(),
            change: userStats.completedChange || '+0%',
            changeType: 'positive',
            icon: CheckCircleIcon,
            color: 'success'
          },
          {
            title: 'Average Completion Time',
            value: avgCompletionTime > 0 ? `${avgCompletionTime.toFixed(1)}h` : '0h',
            change: userStats.timeChange || '0%',
            changeType: 'positive',
            icon: ClockIcon,
            color: 'info'
          },
          {
            title: 'Productivity Score',
            value: `${completionRate}%`,
            change: userStats.productivityChange || '+0%',
            changeType: 'positive',
            icon: ArrowTrendingUpIcon,
            color: 'primary'
          },
          {
            title: 'Active Tasks',
            value: (userStats.ongoing || 0).toString(),
            change: userStats.activeChange || '+0',
            changeType: 'positive',
            icon: ChartBarIcon,
            color: 'warning'
          }
        ];

        // Generate productivity trend data (last 7 days)
        const productivityTrend = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          
          // Calculate tasks completed on this day (mock data for now)
          const tasksCompleted = Math.floor(Math.random() * 10) + 1;
          productivityTrend.push({
            day: dayName,
            tasks: tasksCompleted,
            date: date.toISOString().split('T')[0]
          });
        }

        // Generate task distribution data
        const distribution = [
          {
            status: 'Completed',
            count: userStats.completed || 0,
            color: '#10B981',
            percentage: totalTasks > 0 ? Math.round(((userStats.completed || 0) / totalTasks) * 100) : 0
          },
          {
            status: 'In Progress',
            count: userStats.ongoing || 0,
            color: '#3B82F6',
            percentage: totalTasks > 0 ? Math.round(((userStats.ongoing || 0) / totalTasks) * 100) : 0
          },
          {
            status: 'Overdue',
            count: userStats.failed || 0,
            color: '#EF4444',
            percentage: totalTasks > 0 ? Math.round(((userStats.failed || 0) / totalTasks) * 100) : 0
          }
        ];

        // Format recent activity
        const activity = recentTasks.slice(0, 4).map(task => {
          const timeAgo = formatTimeAgo(task.updatedAt);
          let action = '';
          let type = 'info';

          if (task.status === 'completed') {
            action = `Completed task "${task.title}"`;
            type = 'success';
          } else if (task.status === 'in-progress') {
            action = `Updated task "${task.title}"`;
            type = 'info';
          } else {
            action = `Created task "${task.title}"`;
            type = 'warning';
          }

          return {
            action,
            time: timeAgo,
            type
          };
        });

        setStats(formattedStats);
        setProductivityData(productivityTrend);
        setTaskDistribution(distribution);
        setRecentActivity(activity);

      } catch (err) {
        //console.error('Failed to fetch analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user]);

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

  const getColorClasses = (color) => {
    const colors = {
      success: 'bg-success-100 dark:bg-success-900/20 text-success-600',
      info: 'bg-info-100 dark:bg-info-900/20 text-info-600',
      primary: 'bg-primary-100 dark:bg-primary-900/20 text-primary-600',
      warning: 'bg-warning-100 dark:bg-warning-900/20 text-warning-600'
    };
    return colors[color] || colors.primary;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Analytics
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Track your productivity and performance metrics.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-success-600' 
                        : 'text-error-600'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-secondary-500 dark:text-secondary-400 ml-1">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Productivity Trend (Last 7 Days)
          </h3>
          <div className="h-64 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="h-full flex items-end justify-between space-x-2">
                {productivityData.map((day, index) => {
                  const maxTasks = Math.max(...productivityData.map(d => d.tasks));
                  const height = maxTasks > 0 ? (day.tasks / maxTasks) * 100 : 0;
                  
                  return (
                    <div key={day.day} className="flex flex-col items-center flex-1">
                      <div className="w-full flex justify-center mb-2">
                        <div
                          className="bg-primary-500 rounded-t-md transition-all duration-500 ease-out min-h-[4px] w-8"
                          style={{ height: `${height}%` }}
                          title={`${day.tasks} tasks completed`}
                        ></div>
                      </div>
                      <div className="text-xs text-secondary-600 dark:text-secondary-400 font-medium">
                        {day.day}
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                        {day.tasks}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Task Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
            Task Distribution
          </h3>
          <div className="h-64 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center">
                {/* Donut Chart Simulation */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-secondary-200 dark:text-secondary-700"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      {taskDistribution.map((item, index) => {
                        const totalTasks = taskDistribution.reduce((sum, d) => sum + d.count, 0);
                        const percentage = totalTasks > 0 ? (item.count / totalTasks) * 100 : 0;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const rotation = taskDistribution.slice(0, index).reduce((sum, d) => {
                          const prevPercentage = totalTasks > 0 ? (d.count / totalTasks) * 100 : 0;
                          return sum + (prevPercentage * 3.6);
                        }, 0);
                        
                        return (
                          <path
                            key={item.status}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={item.color}
                            strokeWidth="3"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset="0"
                            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '18px 18px' }}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                          {taskDistribution.reduce((sum, d) => sum + d.count, 0)}
                        </div>
                        <div className="text-xs text-secondary-500 dark:text-secondary-400">
                          Total Tasks
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="space-y-2">
                  {taskDistribution.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-secondary-700 dark:text-secondary-300">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {item.count} ({item.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'success' ? 'bg-success-500' :
                    activity.type === 'info' ? 'bg-info-500' :
                    activity.type === 'warning' ? 'bg-warning-500' : 'bg-secondary-500'
                  }`}></div>
                  <span className="text-secondary-900 dark:text-secondary-100">
                    {activity.action}
                  </span>
                </div>
                <span className="text-sm text-secondary-500 dark:text-secondary-400">
                  {activity.time}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary-500 dark:text-secondary-400">
                No recent activity found. Start creating tasks to see your activity here!
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;