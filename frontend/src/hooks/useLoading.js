import { useState, useCallback, useRef } from 'react'

const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)
  const [loadingStates, setLoadingStates] = useState({})
  const loadingTimeouts = useRef({})

  // Simple loading state
  const startLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Named loading states for multiple operations
  const startNamedLoading = useCallback((name) => {
    setLoadingStates(prev => ({
      ...prev,
      [name]: true
    }))
  }, [])

  const stopNamedLoading = useCallback((name) => {
    setLoadingStates(prev => {
      const newState = { ...prev }
      delete newState[name]
      return newState
    })
    
    // Clear any pending timeout
    if (loadingTimeouts.current[name]) {
      clearTimeout(loadingTimeouts.current[name])
      delete loadingTimeouts.current[name]
    }
  }, [])

  // Check if any named loading state is active
  const isAnyLoading = useCallback(() => {
    return Object.keys(loadingStates).length > 0
  }, [loadingStates])

  // Check if specific named loading state is active
  const isNamedLoading = useCallback((name) => {
    return Boolean(loadingStates[name])
  }, [loadingStates])

  // Wrapper for async operations with automatic loading state
  const withLoading = useCallback(async (asyncFn, name = null) => {
    try {
      if (name) {
        startNamedLoading(name)
      } else {
        startLoading()
      }
      
      const result = await asyncFn()
      return result
    } finally {
      if (name) {
        stopNamedLoading(name)
      } else {
        stopLoading()
      }
    }
  }, [startLoading, stopLoading, startNamedLoading, stopNamedLoading])

  // Set minimum loading time to prevent flashing
  const withMinimumLoading = useCallback(async (asyncFn, minTime = 500, name = null) => {
    const startTime = Date.now()
    
    try {
      if (name) {
        startNamedLoading(name)
      } else {
        startLoading()
      }
      
      const result = await asyncFn()
      
      // Ensure minimum loading time
      const elapsed = Date.now() - startTime
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed))
      }
      
      return result
    } finally {
      if (name) {
        stopNamedLoading(name)
      } else {
        stopLoading()
      }
    }
  }, [startLoading, stopLoading, startNamedLoading, stopNamedLoading])

  // Set timeout for loading state (useful for preventing infinite loading)
  const withTimeout = useCallback((name, timeout = 30000) => {
    if (loadingTimeouts.current[name]) {
      clearTimeout(loadingTimeouts.current[name])
    }
    
    loadingTimeouts.current[name] = setTimeout(() => {
      stopNamedLoading(name)
      //console.warn(`Loading timeout for "${name}" after ${timeout}ms`)
    }, timeout)
  }, [stopNamedLoading])

  // Clear all loading states
  const clearAllLoading = useCallback(() => {
    setIsLoading(false)
    setLoadingStates({})
    
    // Clear all timeouts
    Object.values(loadingTimeouts.current).forEach(clearTimeout)
    loadingTimeouts.current = {}
  }, [])

  return {
    // Simple loading state
    isLoading,
    startLoading,
    stopLoading,
    
    // Named loading states
    loadingStates,
    startNamedLoading,
    stopNamedLoading,
    isAnyLoading,
    isNamedLoading,
    
    // Utility functions
    withLoading,
    withMinimumLoading,
    withTimeout,
    clearAllLoading
  }
}

export default useLoading