import { useState, useCallback, useEffect } from 'react'
import taskService from '../services/taskService'
import { useAuth } from './useAuth'
import { usePaginatedApi, useOptimisticUpdate } from './useApi'

// Hook for managing user tasks
export const useTasks = (userId = null, initialOptions = {}) => {
  const { user } = useAuth()
  const targetUserId = userId || user?.id || user?._id
  
  const apiCall = useCallback(async (params) => {
    if (!targetUserId) {
      throw new Error('User ID is required')
    }
    return await taskService.getUserTasks(targetUserId, params)
  }, [targetUserId])

  const {
    data: tasks,
    pagination,
    loading,
    error,
    fetchData,
    loadMore,
    refresh,
    updateParams
  } = usePaginatedApi(apiCall, initialOptions)

  return {
    tasks,
    pagination,
    loading,
    error,
    fetchTasks: fetchData,
    loadMoreTasks: loadMore,
    refreshTasks: refresh,
    updateTaskParams: updateParams
  }
}

// Hook for managing individual task operations
export const useTaskOperations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createTask = useCallback(async (userId, taskData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.createTask(userId, taskData)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTask = useCallback(async (taskId, taskData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.updateTask(taskId, taskData)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTask = useCallback(async (taskId) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.deleteTask(taskId)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const completeTask = useCallback(async (taskId) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.completeTask(taskId)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTaskStatus = useCallback(async (taskId, status) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.updateTaskStatus(taskId, status)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    updateTaskStatus,
    clearError
  }
}

// Hook for task completion with optimistic updates
export const useTaskCompletion = (initialTasks = []) => {
  const { optimisticUpdate, data: tasks, setData, isPending } = useOptimisticUpdate(initialTasks)

  const toggleTaskCompletion = useCallback(async (taskId) => {
    await optimisticUpdate(
      taskId,
      (task, revert = false) => {
        if (revert) {
          // Revert the optimistic update
          return {
            ...task,
            status: task.status === 'completed' ? 'in-progress' : 'completed',
            completedAt: task.status === 'completed' ? null : new Date().toISOString()
          }
        }
        
        // Apply optimistic update
        const newStatus = task.status === 'completed' ? 'in-progress' : 'completed'
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null
        }
      },
      () => taskService.completeTask(taskId)
    )
  }, [optimisticUpdate])

  return {
    tasks,
    setTasks: setData,
    toggleTaskCompletion,
    isPending
  }
}

// Hook for task filtering and sorting
export const useTaskFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  })

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      priority: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }, [])

  const hasActiveFilters = useCallback(() => {
    return !!(filters.status || filters.priority || filters.search)
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    hasActiveFilters
  }
}

// Hook for task statistics
export const useTaskStats = (userId = null) => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const targetUserId = userId || user?.id || user?._id

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return

    setLoading(true)
    setError(null)

    try {
      const result = await taskService.getTaskStats(targetUserId)
      setStats(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [targetUserId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats
  }
}

// Hook for bulk task operations
export const useBulkTaskOperations = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const bulkUpdate = useCallback(async (taskIds, updateData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.bulkUpdateTasks(taskIds, updateData)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkDelete = useCallback(async (taskIds) => {
    setLoading(true)
    setError(null)

    try {
      const result = await taskService.bulkDeleteTasks(taskIds)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    bulkUpdate,
    bulkDelete
  }
}

export default useTasks