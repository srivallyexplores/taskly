import React, { createContext, useContext, useCallback, useEffect } from 'react'

const ErrorContext = createContext()

export const ErrorProvider = ({ children }) => {
  // Completely self-contained error handlers
  const handleError = useCallback((error, options = {}) => {
    //console.error('Error handled by ErrorProvider:', error)
    
    // Basic error message extraction without any external dependencies
    let errorMessage = 'An unexpected error occurred'
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    //console.error('Processed error message:', errorMessage)
  }, [])

  const handleWarning = useCallback((message, options = {}) => {
    //console.warn('Warning handled by ErrorProvider:', message)
  }, [])

  const handleValidationError = useCallback((validationErrors, options = {}) => {
    //console.error('Validation error handled by ErrorProvider:', validationErrors)
  }, [])

  // Set up global error handlers
  useEffect(() => {
    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event) => {
      //console.error('Unhandled promise rejection:', event.reason)
      handleError(event.reason, {
        context: 'Unhandled Promise Rejection'
      })
      event.preventDefault()
    }

    // Global JavaScript error handler
    const handleGlobalError = (event) => {
      //console.error('Global JavaScript error:', event.error)
      handleError(event.error, {
        context: 'Global JavaScript Error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleGlobalError)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleGlobalError)
    }
  }, [handleError])

  const value = {
    handleError,
    handleWarning,
    handleValidationError
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export const useError = () => {
  const context = useContext(ErrorContext)
  
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  
  return context
}

export default ErrorContext