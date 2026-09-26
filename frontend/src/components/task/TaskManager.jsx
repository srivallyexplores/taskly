import React, { useState, useCallback, useEffect } from 'react'
import TaskList from './TaskList'
import TaskFormModal from './TaskFormModal'
import TaskDeleteConfirmation from './TaskDeleteConfirmation'
import { useTasks, useTaskOperations } from '../../hooks/useTasks'
import { useAuth } from '../../hooks/useAuth'
import { useNotification } from '../../context/NotificationContext'
import { useAnalytics } from '../../context/AnalyticsContext'

const TaskManager = ({
  userId = null,
  showCreateButton = true,
  showFilters = true,
  showUser = false,
  className = ''
}) => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const { onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskCompleted } = useAnalytics()
  const targetUserId = userId || user?.id || user?._id

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)

  // Task operations
  const { createTask, updateTask, deleteTask, loading: operationLoading, error: operationError, clearError } = useTaskOperations()

  // Real-time update interval
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Handle create task
  const handleCreateTask = useCallback(() => {
    setEditingTask(null)
    setIsFormModalOpen(true)
    clearError()
  }, [clearError])

  // Handle edit task
  const handleEditTask = useCallback((task) => {
    setEditingTask(task)
    setIsFormModalOpen(true)
    clearError()
  }, [clearError])

  // Handle delete task
  const handleDeleteTask = useCallback((taskId, taskTitle) => {
    // Find the task to delete
    const taskToDelete = { _id: taskId, title: taskTitle }
    setDeletingTask(taskToDelete)
  }, [])

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let result
      if (editingTask) {
        // Update existing task
        result = await updateTask(editingTask._id, formData)
        showSuccess('Task updated successfully')
        
        // Trigger analytics update
        onTaskUpdated({
          taskId: editingTask._id,
          userId: targetUserId,
          task: result.data
        })
      } else {
        // Create new task
        result = await createTask(targetUserId, formData)
        showSuccess('Task created successfully')
        
        // Trigger analytics update
        onTaskCreated({
          taskId: result.data._id,
          userId: targetUserId,
          task: result.data
        })
      }
      
      setIsFormModalOpen(false)
      setEditingTask(null)
      setLastRefresh(new Date())
    } catch (error) {
      //console.error('Task operation failed:', error)
      showError(error.message || 'Operation failed')
    }
  }, [editingTask, updateTask, createTask, targetUserId, showSuccess, showError, onTaskCreated, onTaskUpdated])

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setIsFormModalOpen(false)
    setEditingTask(null)
    clearError()
  }, [clearError])

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async (taskId) => {
    try {
      await deleteTask(taskId)
      showSuccess('Task deleted successfully')
      
      // Trigger analytics update
      onTaskDeleted({
        taskId,
        userId: targetUserId
      })
      
      setDeletingTask(null)
      setLastRefresh(new Date())
    } catch (error) {
      //console.error('Delete task failed:', error)
      showError(error.message || 'Failed to delete task')
    }
  }, [deleteTask, showSuccess, showError, onTaskDeleted, targetUserId])

  // Handle delete cancel
  const handleDeleteCancel = useCallback(() => {
    setDeletingTask(null)
  }, [])

  // Auto-refresh functionality for real-time updates
  const startAutoRefresh = useCallback(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
    }

    const interval = setInterval(() => {
      setLastRefresh(new Date())
    }, 30000) // Refresh every 30 seconds

    setAutoRefreshInterval(interval)
  }, [autoRefreshInterval])

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval)
      setAutoRefreshInterval(null)
    }
  }, [autoRefreshInterval])

  // Start auto-refresh when component mounts
  useEffect(() => {
    startAutoRefresh()
    
    return () => {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  // Handle visibility change for auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoRefresh()
      } else {
        startAutoRefresh()
        setLastRefresh(new Date()) // Immediate refresh when tab becomes visible
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [startAutoRefresh, stopAutoRefresh])

  return (
    <div className={`task-manager ${className}`}>
      <div className="task-manager-header">
        <div className="header-content">
          <h2>Tasks</h2>
          <div className="header-actions">
            <div className="refresh-info">
              <span className="last-refresh">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                className="refresh-btn"
                onClick={() => setLastRefresh(new Date())}
                aria-label="Refresh tasks"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 4V10C1 11.6569 2.34315 13 4 13H12C13.6569 13 15 11.6569 15 10V6C15 4.34315 13.6569 3 12 3H4C2.34315 3 1 4.34315 1 6V4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1 4L8 9L15 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            
            {showCreateButton && (
              <button
                className="btn btn-primary create-task-btn"
                onClick={handleCreateTask}
                disabled={operationLoading}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1V15M1 8H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Create Task
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="task-manager-content">
        <TaskList
          userId={targetUserId}
          showFilters={showFilters}
          showUser={showUser}
          onTaskEdit={handleEditTask}
          onTaskDelete={handleDeleteTask}
          key={lastRefresh.getTime()} // Force re-render on refresh
        />
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        task={editingTask}
        onSubmit={handleFormSubmit}
        onClose={handleFormCancel}
        loading={operationLoading}
        error={operationError}
      />

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <TaskDeleteConfirmation
          task={deletingTask}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          loading={operationLoading}
        />
      )}
    </div>
  )
}

export default TaskManager