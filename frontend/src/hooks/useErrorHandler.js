import { useCallback } from 'react'

const useErrorHandler = () => {
  const handleError = useCallback((error, options = {}) => {
    //console.error('Error handled by useErrorHandler:', error)

    let errorMessage = 'An unexpected error occurred'

    // Parse different types of errors
    if (error?.response) {
      // API response error
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          errorMessage = data?.error?.message || data?.message || 'Invalid request'
          break
        case 401:
          errorMessage = 'You are not authorized. Please log in again.'
          return // Don't show notification for 401 as it's handled by interceptor
        case 403:
          errorMessage = 'You do not have permission to perform this action'
          break
        case 404:
          errorMessage = 'The requested resource was not found'
          break
        case 409:
          errorMessage = data?.error?.message || 'A conflict occurred'
          break
        case 422:
          errorMessage = data?.error?.message || 'Validation failed'
          break
        case 429:
          errorMessage = 'Too many requests. Please try again later.'
          break
        case 500:
          errorMessage = 'Server error. Please try again later.'
          break
        case 502:
        case 503:
        case 504:
          errorMessage = 'Service temporarily unavailable. Please try again later.'
          break
        default:
          errorMessage = data?.error?.message || data?.message || `Error ${status}: ${error.response.statusText}`
      }
    } else if (error?.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error?.message) {
      // JavaScript error
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    // Just log for now - notification integration can be added later
    //console.error('Processed error:', errorMessage)

    // Report to monitoring service if available
    if (window.reportError && error instanceof Error) {
      window.reportError(error, {
        context: options.context || 'useErrorHandler',
        userId: options.userId,
        timestamp: new Date().toISOString()
      })
    }
  }, [])

  const handleWarning = useCallback((message, options = {}) => {
    //console.warn('Warning:', message)
  }, [])

  const handleValidationError = useCallback((validationErrors, options = {}) => {
    let errorMessage = 'Validation failed'
    
    if (Array.isArray(validationErrors)) {
      // Multiple validation errors
      errorMessage = validationErrors.map(err => err.message || err).join(', ')
    } else if (typeof validationErrors === 'object') {
      // Object with field errors
      const errors = Object.values(validationErrors).flat()
      errorMessage = errors.join(', ')
    } else {
      // Single validation error
      errorMessage = validationErrors
    }
    
    //console.error('Validation error:', errorMessage)
  }, [])

  return {
    handleError,
    handleWarning,
    handleValidationError
  }
}

export default useErrorHandler