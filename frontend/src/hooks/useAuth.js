import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

// Main useAuth hook (re-exported from context)
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Hook for checking if user has specific permissions
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth()
  
  const hasPermission = (permission) => {
    if (!isAuthenticated || !user) return false
    
    // Add permission logic based on user roles/permissions
    // For now, we'll implement basic role-based permissions
    const userRole = user.role || 'user'
    
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_all_tasks'],
      user: ['read', 'write', 'delete_own', 'view_own_tasks']
    }
    
    return permissions[userRole]?.includes(permission) || false
  }
  
  const isAdmin = () => {
    return user?.role === 'admin'
  }
  
  const canManageUsers = () => {
    return hasPermission('manage_users')
  }
  
  const canViewAllTasks = () => {
    return hasPermission('view_all_tasks')
  }
  
  const canDeleteTask = (taskOwnerId) => {
    if (!isAuthenticated || !user) return false
    
    // Admin can delete any task
    if (isAdmin()) return true
    
    // User can delete their own tasks
    return user.id === taskOwnerId || user._id === taskOwnerId
  }
  
  const canEditTask = (taskOwnerId) => {
    if (!isAuthenticated || !user) return false
    
    // Admin can edit any task
    if (isAdmin()) return true
    
    // User can edit their own tasks
    return user.id === taskOwnerId || user._id === taskOwnerId
  }
  
  return {
    hasPermission,
    isAdmin,
    canManageUsers,
    canViewAllTasks,
    canDeleteTask,
    canEditTask
  }
}

// Hook for handling authentication redirects
export const useAuthRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth()
  
  const requireAuth = (redirectTo = '/login') => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo
      return false
    }
    return true
  }
  
  const requireGuest = (redirectTo = '/') => {
    if (!isLoading && isAuthenticated) {
      window.location.href = redirectTo
      return false
    }
    return true
  }
  
  return {
    requireAuth,
    requireGuest
  }
}

// Hook for session management (replaces token management)
export const useSession = () => {
  const { isAuthenticated, user } = useAuth()
  
  const isSessionValid = () => {
    return isAuthenticated && !!user
  }
  
  const getSessionUser = () => {
    return user
  }
  
  return {
    isSessionValid,
    getSessionUser
  }
}

export default useAuth