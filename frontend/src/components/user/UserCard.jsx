import React, { useState, useEffect } from 'react'
import { useAuth, usePermissions } from '../../hooks/useAuth'
import userService from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import SuccessMessage from '../common/SuccessMessage'

const UserCard = ({ user, onUserUpdate, onUserDelete }) => {
  const { user: currentUser } = useAuth()
  const { canManageUsers } = usePermissions()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isOwnCard = (currentUser?.id || currentUser?._id) === (user?.id || user?._id)
  const canDelete = canManageUsers() && !isOwnCard

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const userId = user?.id || user?._id
        const statsData = await userService.getUserStats(userId)
        setStats(statsData.data?.stats || {})
      } catch (err) {
        // Don't show error for stats - it's not critical
        //console.warn('Failed to load user stats:', err.message)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true)
      setError(null)
      
      const userId = user?.id || user?._id
      await userService.deleteUser(userId)
      
      setSuccess('User deleted successfully')
      
      // Notify parent component
      if (onUserDelete) {
        onUserDelete(userId)
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAvatarUrl = (avatar) => {
    if (!avatar) return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/img/placeholder-user.png`
    if (avatar.startsWith('http')) return avatar
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${avatar}`
  }

  const getCompletionRateColor = (rate) => {
    if (rate >= 80) return '#28a745' // Green
    if (rate >= 60) return '#ffc107' // Yellow
    if (rate >= 40) return '#fd7e14' // Orange
    return '#dc3545' // Red
  }

  return (
    <div className="user-card">
      {error && (
        <ErrorMessage 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <SuccessMessage 
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <div className="user-card-header">
        <div className="user-avatar">
          <img 
            src={getAvatarUrl(user.avatar)} 
            alt={`${user.firstName} ${user.lastName}`}
            className="avatar-image"
          />
          {user.role && (
            <span className={`user-role role-${user.role}`}>
              {user.role}
            </span>
          )}
        </div>
        
        <div className="user-info">
          <h3 className="user-name">
            {user.firstName} {user.lastName}
            {isOwnCard && <span className="own-badge">(You)</span>}
          </h3>
          <p className="user-email">{user.email}</p>
          <p className="user-joined">
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* User Statistics */}
      <div className="user-stats">
        {statsLoading ? (
          <div className="stats-loading">
            <LoadingSpinner size="small" message="Loading stats..." />
          </div>
        ) : stats ? (
          <div className="stats-content">
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{stats.totalTasks || 0}</span>
                <span className="stat-label">Tasks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.completedTasks || 0}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-item">
                <span 
                  className="stat-value completion-rate"
                  style={{ color: getCompletionRateColor(stats.completionRate || 0) }}
                >
                  {stats.completionRate ? `${Math.round(stats.completionRate)}%` : '0%'}
                </span>
                <span className="stat-label">Success Rate</span>
              </div>
            </div>
            
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{stats.currentStreak || 0}</span>
                <span className="stat-label">Current Streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.longestStreak || 0}</span>
                <span className="stat-label">Best Streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {stats.averageCompletionTime ? `${Math.round(stats.averageCompletionTime)}h` : 'N/A'}
                </span>
                <span className="stat-label">Avg. Time</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-unavailable">
            <p>Statistics unavailable</p>
          </div>
        )}
      </div>

      {/* User Bio */}
      {user.bio && (
        <div className="user-bio">
          <p>{user.bio}</p>
        </div>
      )}

      {/* Card Actions */}
      <div className="user-card-actions">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => window.location.href = `/users/${user.id || user._id}`}
        >
          View Profile
        </button>
        
        {canDelete && (
          <button 
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteLoading}
          >
            {deleteLoading ? <LoadingSpinner size="small" message="" /> : 'Delete'}
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete <strong>{user.firstName} {user.lastName}</strong>? 
              This action cannot be undone and will permanently remove their account and all associated data.
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={deleteLoading}
              >
                {deleteLoading ? <LoadingSpinner size="small" message="" /> : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserCard