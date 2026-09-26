import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import FlashContainer from '../components/common/FlashContainer'
import api from '../services/api'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  // Flash notifications (toasts)
  const [flashNotifications, setFlashNotifications] = useState([])
  
  // In-app notifications from API
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    mentionNotifications: true,
    assignmentNotifications: true
  })

  // Flash notification methods
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      ...notification,
      timestamp: Date.now()
    }

    setFlashNotifications(prev => [...prev, newNotification])

    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 5000)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setFlashNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setFlashNotifications([])
  }, [])

  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options })
  }, [addNotification])

  const showError = useCallback((message, options = {}) => {
    return addNotification({ type: 'error', message, duration: 0, ...options })
  }, [addNotification])

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options })
  }, [addNotification])

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options })
  }, [addNotification])

  // In-app notification methods (from API)
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/notifications')
      if (response.data.success) {
        setNotifications(response.data.data.notifications || [])
        setUnreadCount(response.data.data.unreadCount || 0)
      }
    } catch (error) {
      //console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread/count')
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount || 0)
      }
    } catch (error) {
      //console.error('Error fetching unread count:', error)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`)
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      //console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.put('/notifications/read/all')
      if (response.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      //console.error('Error marking all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)
      if (response.data.success) {
        const notification = notifications.find(n => n._id === notificationId)
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      //console.error('Error deleting notification:', error)
    }
  }, [notifications])

  const updateNotificationSettings = useCallback((settings) => {
    setNotificationSettings(settings)
    // TODO: Save to backend when endpoint is available
  }, [])

  const value = {
    // Flash notifications
    flashNotifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    // In-app notifications
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notificationSettings,
    updateNotificationSettings
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <FlashContainer />
    </NotificationContext.Provider>
  )
}



export const useNotification = () => {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  
  return context
}

export default NotificationContext