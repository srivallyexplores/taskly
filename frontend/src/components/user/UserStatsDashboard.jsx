import React, { useState, useEffect } from 'react'
import userService from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import ProductivityAnalytics from '../dashboard/ProductivityAnalytics'

const UserStatsDashboard = ({ userId, user }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const targetUserId = userId || user?.id || user?._id
        if (targetUserId) {
          const statsData = await userService.getUserStats(targetUserId)
          setStats(statsData.data?.stats || {})
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId, user])

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!stats) {
    return (
      <div className="stats-dashboard">
        <h2>Statistics Dashboard</h2>
        <p>No statistics available for this user.</p>
      </div>
    )
  }

  return (
    <div className="stats-dashboard">
      <div className="dashboard-header">
        <h2>Statistics Dashboard</h2>
        <p>Comprehensive overview of task performance and productivity metrics</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
           Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <p>Basic statistics overview will be displayed here.</p>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <ProductivityAnalytics userId={userId} user={user} />
          </div>
        )}
      </div>
    </div>
  )
}

export default UserStatsDashboard