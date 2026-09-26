import { useState, useCallback, useRef, useEffect } from 'react'

// Hook for handling API calls with loading states and error handling
export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)

  // Cleanup function to abort ongoing requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const execute = useCallback(async (apiCall, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      showLoading = true,
      abortPrevious = true 
    } = options

    // Abort previous request if needed
    if (abortPrevious && abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      if (showLoading) setLoading(true)
      setError(null)

      const result = await apiCall(abortControllerRef.current.signal)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      return result
    } catch (err) {
      // Don't set error for aborted requests
      if (err.name !== 'AbortError') {
        const errorMessage = err.message || 'An unexpected error occurred'
        setError(errorMessage)
        
        if (onError) {
          onError(err)
        }
      }
      
      throw err
    } finally {
      if (showLoading) setLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    loading,
    error,
    execute,
    clearError,
    abort
  }
}

// Hook for handling paginated API calls
export const usePaginatedApi = (apiCall, initialParams = {}) => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchData = useCallback(async (newParams = {}) => {
    setLoading(true)
    setError(null)

    try {
      const mergedParams = { ...params, ...newParams }
      const response = await apiCall(mergedParams)
      
      if (response.success) {
        setData(response.data.items || response.data)
        setPagination(response.data.pagination || {})
        setParams(mergedParams)
      } else {
        throw new Error(response.message || 'Failed to fetch data')
      }
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [apiCall, params])

  const loadMore = useCallback(async () => {
    if (pagination.hasNextPage && !loading) {
      setLoading(true)
      
      try {
        const nextPageParams = { ...params, page: pagination.currentPage + 1 }
        const response = await apiCall(nextPageParams)
        
        if (response.success) {
          setData(prevData => [...prevData, ...(response.data.items || response.data)])
          setPagination(response.data.pagination || {})
          setParams(nextPageParams)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }, [apiCall, params, pagination, loading])

  const refresh = useCallback(() => {
    fetchData({ ...params, page: 1 })
  }, [fetchData, params])

  const updateParams = useCallback((newParams) => {
    fetchData({ ...newParams, page: 1 })
  }, [fetchData])

  return {
    data,
    pagination,
    loading,
    error,
    fetchData,
    loadMore,
    refresh,
    updateParams,
    setError
  }
}

// Hook for handling form submissions with API calls
export const useApiForm = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const submit = useCallback(async (apiCall, formData, options = {}) => {
    const { onSuccess, onError, resetOnSuccess = true } = options

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await apiCall(formData)
      
      setSuccess(true)
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (resetOnSuccess) {
        setTimeout(() => setSuccess(false), 3000)
      }
      
      return result
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while submitting the form'
      setError(errorMessage)
      
      if (onError) {
        onError(err)
      }
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  return {
    loading,
    error,
    success,
    submit,
    clearMessages
  }
}

// Hook for handling optimistic updates
export const useOptimisticUpdate = (initialData = []) => {
  const [data, setData] = useState(initialData)
  const [pendingUpdates, setPendingUpdates] = useState(new Map())

  const optimisticUpdate = useCallback(async (id, updateFn, apiCall) => {
    // Apply optimistic update
    setData(prevData => prevData.map(item => 
      item.id === id || item._id === id ? updateFn(item) : item
    ))
    
    // Track pending update
    setPendingUpdates(prev => new Map(prev).set(id, true))

    try {
      // Make API call
      const result = await apiCall()
      
      // Update with server response
      setData(prevData => prevData.map(item => 
        (item.id === id || item._id === id) ? result.data : item
      ))
    } catch (error) {
      // Revert optimistic update on error
      setData(prevData => prevData.map(item => 
        item.id === id || item._id === id ? updateFn(item, true) : item
      ))
      throw error
    } finally {
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newMap = new Map(prev)
        newMap.delete(id)
        return newMap
      })
    }
  }, [])

  const isPending = useCallback((id) => {
    return pendingUpdates.has(id)
  }, [pendingUpdates])

  return {
    data,
    setData,
    optimisticUpdate,
    isPending
  }
}

export default useApi