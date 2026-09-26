import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRole = null,
  redirectTo = '/login',
  fallback = null 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return fallback || <LoadingSpinner message="Checking authentication..." />
  }

  // Handle authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with return URL
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Handle guest-only routes (redirect authenticated users)
  if (!requireAuth && isAuthenticated) {
    const returnTo = location.state?.from || '/'
    return <Navigate to={returnTo} replace />
  }

  // Handle role-based access
  if (requiredRole && (!user || user.role !== requiredRole)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location.pathname }} 
        replace 
      />
    )
  }

  // Render children if all checks pass
  return children
}

// Higher-order component for protecting routes
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Component for admin-only routes
export const AdminRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requiredRole="admin" 
      redirectTo="/unauthorized"
      {...props}
    >
      {children}
    </ProtectedRoute>
  )
}

// Component for guest-only routes (login, signup)
export const GuestRoute = ({ children, ...props }) => {
  return (
    <ProtectedRoute 
      requireAuth={false} 
      {...props}
    >
      {children}
    </ProtectedRoute>
  )
}

export default ProtectedRoute