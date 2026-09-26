import React, { useState, useEffect, useCallback } from 'react'
import userService from '../../services/userService'
import taskService from '../../services/taskService'
import SimpleChart from '../common/SimpleChart'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import { useAnalytics } from '../../context/AnalyticsContext'

const ProductivityAnalytics = ({ userId, user }) => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { registerAnalyticsListener } = useAnalytics()

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    try {
      setError(null)
      if (showLoading) {
        setLoading(true)
      }
      
      const targetUserId = userId || user?.id || user?._id
      if (!targetUserId) {
        throw new Error('User ID is required')
      }

      // Fetch productivity stats
      const statsResponse = await userService.getUserStats(targetUserId)
      const stats = statsResponse.data

      // Fetch recent tasks for trend analysis
      const tasksResponse = await taskService.getTasksByUser(targetUserId, { 
        page: 1, 
        limit: 30,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
      const recentTasks = tasksResponse.data.tasks

      // Calculate trends and additional analytics
      const analyticsData = calculateAnalytics(stats, recentTasks)
      
      setAnalytics(analyticsData)
      setLastUpdated(new Date())
    } catch (err) {
      //console.error('Error fetching analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, user])

  const calculateAnalytics = (stats, tasks) => {
    // Calculate completion trends over the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    const completionTrend = last7Days.map(date => {
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.updatedAt)
        return taskDate.toDateString() === date.toDateString() && task.status === 'completed'
      })
      
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayTasks.length
      }
    })

    // Calculate task status distribution
    const statusDistribution = [
      { label: 'Completed', value: stats.completed || 0, color: '#28a745' },
      { label: 'In Progress', value: stats.ongoing || 0, color: '#ffc107' },
      { label: 'Failed', value: stats.failed || 0, color: '#dc3545' }
    ]

    // Calculate monthly completion rates
    const monthlyData = calculateMonthlyTrends(tasks)

    // Calculate productivity score
    const totalTasks = (stats.completed || 0) + (stats.failed || 0)
    const productivityScore = totalTasks > 0 ? Math.round((stats.completed / totalTasks) * 100) : 0

    // Calculate average tasks per day
    const avgTasksPerDay = tasks.length > 0 ? (tasks.length / 30).toFixed(1) : 0

    return {
      stats,
      completionTrend,
      statusDistribution,
      monthlyData,
      productivityScore,
      avgTasksPerDay,
      totalTasks,
      recentTasksCount: tasks.length
    }
  }

  const calculateMonthlyTrends = (tasks) => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - i))
      return date
    })

    return last6Months.map(date => {
      const monthTasks = tasks.filter(task => {
        const taskDate = new Date(task.updatedAt)
        return taskDate.getMonth() === date.getMonth() && 
               taskDate.getFullYear() === date.getFullYear() &&
               task.status === 'completed'
      })
      
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        value: monthTasks.length
      }
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics(false)
  }

  // Handle real-time analytics updates
  const handleAnalyticsEvent = useCallback((eventType, data) => {
    const targetUserId = userId || user?.id || user?._id
    
    // Only refresh if the event is for the current user
    if (data?.user === targetUserId || data?.userId === targetUserId) {
      //console.log(`Analytics event received: ${eventType}`, data)
      
      // Debounce rapid updates
      setTimeout(() => {
        fetchAnalytics(false)
      }, 1000)
    }
  }, [userId, user, fetchAnalytics])

  const getTrendIndicator = (current, previous) => {
    if (current > previous) {
      return <span className="trend-indicator trend-up">↗ +{current - previous}</span>
    } else if (current < previous) {
      return <span className="trend-indicator trend-down">↘ -{previous - current}</span>
    }
    return <span className="trend-indicator trend-neutral">→ No change</span>
  }

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Register for real-time analytics updates
  useEffect(() => {
    const unregister = registerAnalyticsListener(handleAnalyticsEvent)
    return unregister
  }, [registerAnalyticsListener, handleAnalyticsEvent])

  if (loading) {
    return <LoadingSpinner message="Loading analytics..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={fetchAnalytics}
      />
    )
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <h2>Productivity Analytics</h2>
        <p>No analytics data available.</p>
      </div>
    )
  }

  const { stats, completionTrend, statusDistribution, monthlyData, productivityScore, avgTasksPerDay, totalTasks } = analytics

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Productivity Analytics</h2>
        <p>Comprehensive insights into your task completion patterns and productivity trends</p>
        <div className="analytics-controls">
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>🔄</span>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="analytics-summary">
        <div className="summary-item">
          <div className="summary-value">{productivityScore}%</div>
          <div className="summary-label">Success Rate</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{stats.streak || 0}</div>
          <div className="summary-label">Current Streak</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{avgTasksPerDay}</div>
          <div className="summary-label">Tasks/Day</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{totalTasks}</div>
          <div className="summary-label">Total Tasks</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Daily Completion Trend */}
        <div className="analytics-section">
          <h3>
            Daily Completion Trend
            {completionTrend.length > 1 && getTrendIndicator(
              completionTrend[completionTrend.length - 1]?.value || 0,
              completionTrend[completionTrend.length - 2]?.value || 0
            )}
          </h3>
          <SimpleChart
            data={completionTrend}
            type="line"
            height={200}
            color="#007bff"
          />
        </div>

        {/* Task Status Distribution */}
        <div className="analytics-section">
          <h3>Task Status Distribution</h3>
          <SimpleChart
            data={statusDistribution}
            type="bar"
            height={200}
            color="#28a745"
          />
        </div>

        {/* Monthly Completion Trends */}
        <div className="analytics-section">
          <h3>
            Monthly Completion Trends
            {monthlyData.length > 1 && getTrendIndicator(
              monthlyData[monthlyData.length - 1]?.value || 0,
              monthlyData[monthlyData.length - 2]?.value || 0
            )}
          </h3>
          <SimpleChart
            data={monthlyData}
            type="bar"
            height={200}
            color="#17a2b8"
          />
        </div>

        {/* Performance Metrics */}
        <div className="analytics-section">
          <h3>Performance Metrics</h3>
          <div className="performance-metrics">
            <div className="metric-row">
              <span className="metric-label">Completion Rate:</span>
              <span className="metric-value">{stats.completionRate || 0}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Average Time:</span>
              <span className="metric-value">{stats.avgTime || 'N/A'}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Best Streak:</span>
              <span className="metric-value">{stats.streak || 0} days</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Active Tasks:</span>
              <span className="metric-value">{stats.ongoing || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductivityAnalytics