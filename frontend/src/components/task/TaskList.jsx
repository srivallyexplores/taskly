import React, { useState, useEffect, useCallback } from 'react'
import TaskCard from './TaskCard'
import TaskFilters from './TaskFilters'
import LoadingSpinner, { InlineSpinner } from '../common/LoadingSpinner'
import { SkeletonCard } from '../common/SkeletonLoader'
import ErrorMessage from '../common/ErrorMessage'
import { useTasks, useTaskOperations, useTaskFilters } from '../../hooks/useTasks'
import { useAuth } from '../../hooks/useAuth'
import { useAnalytics } from '../../context/AnalyticsContext'

const TaskList = ({ 
  userId = null, 
  showFilters = true, 
  showUser = false,
  className = '',
  onTaskEdit,
  onTaskDelete,
  initialFilters = {}
}) => {
  const { user } = useAuth()
  const { onTaskCompleted, onTaskUpdated } = useAnalytics()
  const targetUserId = userId || user?.id || user?._id
  
  const { filters, updateFilter, updateFilters, resetFilters, hasActiveFilters } = useTaskFilters(initialFilters)
  const { tasks, pagination, loading, error, fetchTasks, loadMoreTasks, refreshTasks, updateTaskParams } = useTasks(targetUserId, filters)
  const { updateTaskStatus, loading: operationLoading } = useTaskOperations()
  
  const [selectedTasks, setSelectedTasks] = useState(new Set())
  const [sortBy, setSortBy] = useState(filters.sortBy || 'createdAt')
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'desc')

  // Update API params when filters change
  useEffect(() => {
    updateTaskParams({ ...filters, sortBy, sortOrder })
  }, [filters, sortBy, sortOrder, updateTaskParams])

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (taskId, shouldComplete) => {
    try {
      const newStatus = shouldComplete ? 'completed' : 'in-progress'
      const result = await updateTaskStatus(taskId, newStatus)
      
      // Find the task to get user info
      const task = tasks.find(t => t._id === taskId)
      if (task) {
        // Trigger analytics update
        if (shouldComplete) {
          onTaskCompleted({
            taskId,
            userId: task.user || targetUserId,
            task: { ...task, status: newStatus }
          })
        } else {
          onTaskUpdated({
            taskId,
            userId: task.user || targetUserId,
            task: { ...task, status: newStatus }
          })
        }
      }
      
      // Refresh tasks to get updated data
      refreshTasks()
    } catch (error) {
      //console.error('Failed to update task status:', error)
    }
  }, [updateTaskStatus, refreshTasks, tasks, targetUserId, onTaskCompleted, onTaskUpdated])

  // Handle task edit
  const handleTaskEdit = useCallback((task) => {
    if (onTaskEdit) {
      onTaskEdit(task)
    }
  }, [onTaskEdit])

  // Handle task delete
  const handleTaskDelete = useCallback((taskId, taskTitle) => {
    if (onTaskDelete) {
      onTaskDelete(taskId, taskTitle)
    }
  }, [onTaskDelete])

  // Handle filter changes
  const handleFilterChange = useCallback((filterKey, value) => {
    updateFilter(filterKey, value)
  }, [updateFilter])

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy, newSortOrder = 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  // Handle bulk selection
  const handleSelectTask = useCallback((taskId) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(tasks.map(task => task._id)))
    }
  }, [tasks, selectedTasks.size])

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination?.hasNextPage && !loading) {
      loadMoreTasks()
    }
  }, [pagination?.hasNextPage, loading, loadMoreTasks])

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchTasks()
  }, [fetchTasks])

  if (error && !tasks.length) {
    return (
      <div className={`task-list-error ${className}`}>
        <ErrorMessage
          message={error}
          onRetry={handleRetry}
          title="Failed to load tasks"
        />
      </div>
    )
  }

  return (
    <div className={`task-list ${className}`}>
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onResetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters()}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      )}

      <div className="task-list-header">
        <div className="task-count">
          {pagination?.totalItems ? (
            <span>
              {pagination.totalItems} task{pagination.totalItems !== 1 ? 's' : ''}
              {hasActiveFilters() && ' (filtered)'}
            </span>
          ) : (
            <span>No tasks</span>
          )}
        </div>

        {tasks.length > 0 && (
          <div className="bulk-actions">
            <label className="select-all">
              <input
                type="checkbox"
                checked={selectedTasks.size === tasks.length && tasks.length > 0}
                onChange={handleSelectAll}
              />
              Select All
            </label>
            {selectedTasks.size > 0 && (
              <span className="selected-count">
                {selectedTasks.size} selected
              </span>
            )}
          </div>
        )}
      </div>

      {loading && !tasks.length ? (
        <div className="task-list-loading">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard 
              key={index} 
              hasAvatar={showUser}
              lines={2}
              className="task-skeleton"
            />
          ))}
        </div>
      ) : (
        <>
          {tasks.length === 0 ? (
            <div className="task-list-empty">
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path
                    d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8zm0 44c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"
                    fill="currentColor"
                    opacity="0.3"
                  />
                  <path
                    d="M32 20v16l12 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.5"
                  />
                </svg>
                <h3>No tasks found</h3>
                <p>
                  {hasActiveFilters() 
                    ? 'Try adjusting your filters to see more tasks.'
                    : 'Create your first task to get started!'
                  }
                </p>
                {hasActiveFilters() && (
                  <button 
                    className="clear-filters-btn"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="task-list-content">
              {tasks.map((task) => (
                <div key={task._id} className="task-list-item">
                  {selectedTasks.size > 0 && (
                    <label className="task-selector">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task._id)}
                        onChange={() => handleSelectTask(task._id)}
                      />
                    </label>
                  )}
                  <TaskCard
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleTaskEdit}
                    onDelete={handleTaskDelete}
                    showUser={showUser}
                    className={operationLoading ? 'updating' : ''}
                  />
                </div>
              ))}
            </div>
          )}

          {pagination?.hasNextPage && (
            <div className="task-list-pagination">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <InlineSpinner size="small" />
                    Loading more...
                  </>
                ) : (
                  `Load More (${pagination.totalItems - tasks.length} remaining)`
                )}
              </button>
            </div>
          )}

          {error && tasks.length > 0 && (
            <div className="task-list-error-footer">
              <ErrorMessage
                message={error}
                onRetry={handleRetry}
                title="Failed to load more tasks"
                className="inline-error"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default TaskList