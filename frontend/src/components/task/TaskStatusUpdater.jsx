import React, { useState, useCallback, useEffect } from 'react'
import { useTaskOperations } from '../../hooks/useTasks'
import { useNotification } from '../../context/NotificationContext'
import { useAnalytics } from '../../context/AnalyticsContext'
import LoadingSpinner from '../common/LoadingSpinner'

const TaskStatusUpdater = ({
  tasks = [],
  onTasksUpdate,
  autoUpdateInterval = 60000, // 1 minute
  className = ''
}) => {
  const { updateTaskStatus, loading } = useTaskOperations()
  const { showSuccess, showError, showInfo, showWarning } = useNotification()
  const { onTaskUpdated, onTaskCompleted } = useAnalytics()
  
  const [updatingTasks, setUpdatingTasks] = useState(new Set())
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date())
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true)

  // Check for tasks that should automatically change status
  const checkTaskStatusUpdates = useCallback(async () => {
    const now = new Date()
    const tasksToUpdate = []

    tasks.forEach(task => {
      const dueDate = new Date(task.due)
      
      // Check if in-progress tasks should become failed (past due date)
      if (task.status === 'in-progress' && dueDate < now) {
        tasksToUpdate.push({
          id: task._id,
          newStatus: 'failed',
          reason: 'Past due date'
        })
      }
    })

    // Update tasks that need status changes
    for (const update of tasksToUpdate) {
      try {
        setUpdatingTasks(prev => new Set(prev).add(update.id))
        
        const result = await updateTaskStatus(update.id, update.newStatus)
        
        // Update local task list
        if (onTasksUpdate) {
          const updatedTasks = tasks.map(task => 
            task._id === update.id 
              ? { ...task, status: update.newStatus }
              : task
          )
          onTasksUpdate(updatedTasks)
        }

        // Trigger analytics update
        const task = tasks.find(t => t._id === update.id)
        if (task) {
          if (update.newStatus === 'completed') {
            onTaskCompleted({
              taskId: update.id,
              userId: task.user,
              task: { ...task, status: update.newStatus }
            })
          } else {
            onTaskUpdated({
              taskId: update.id,
              userId: task.user,
              task: { ...task, status: update.newStatus }
            })
          }
        }

        showInfo(`Task status updated to ${update.newStatus}: ${update.reason}`)
      } catch (error) {
        //console.error('Failed to update task status:', error)
        showError(`Failed to update task status: ${error.message}`)
      } finally {
        setUpdatingTasks(prev => {
          const newSet = new Set(prev)
          newSet.delete(update.id)
          return newSet
        })
      }
    }

    setLastUpdateTime(new Date())
  }, [tasks, updateTaskStatus, onTasksUpdate, showNotification])

  // Manual status update
  const handleManualStatusUpdate = useCallback(async (taskId, newStatus) => {
    try {
      setUpdatingTasks(prev => new Set(prev).add(taskId))
      
      const result = await updateTaskStatus(taskId, newStatus)
      
      // Update local task list
      if (onTasksUpdate) {
        const updatedTasks = tasks.map(task => 
          task._id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
        onTasksUpdate(updatedTasks)
      }

      // Trigger analytics update
      const task = tasks.find(t => t._id === taskId)
      if (task) {
        if (newStatus === 'completed') {
          onTaskCompleted({
            taskId,
            userId: task.user,
            task: { ...task, status: newStatus }
          })
        } else {
          onTaskUpdated({
            taskId,
            userId: task.user,
            task: { ...task, status: newStatus }
          })
        }
      }

      showSuccess('Task status updated successfully')
    } catch (error) {
      //console.error('Failed to update task status:', error)
      showError(`Failed to update task status: ${error.message}`)
    } finally {
      setUpdatingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(taskId)
        return newSet
      })
    }
  }, [updateTaskStatus, tasks, onTasksUpdate, showNotification])

  // Bulk status update
  const handleBulkStatusUpdate = useCallback(async (taskIds, newStatus) => {
    const updatePromises = taskIds.map(taskId => 
      handleManualStatusUpdate(taskId, newStatus)
    )

    try {
      await Promise.all(updatePromises)
      showSuccess(`${taskIds.length} tasks updated to ${newStatus}`)
    } catch (error) {
      showWarning('Some tasks failed to update')
    }
  }, [handleManualStatusUpdate, showNotification])

  // Auto-update effect
  useEffect(() => {
    if (!autoUpdateEnabled) return

    const interval = setInterval(() => {
      checkTaskStatusUpdates()
    }, autoUpdateInterval)

    // Initial check
    checkTaskStatusUpdates()

    return () => clearInterval(interval)
  }, [autoUpdateEnabled, autoUpdateInterval, checkTaskStatusUpdates])

  // Get tasks that need attention
  const getTasksNeedingAttention = useCallback(() => {
    const now = new Date()
    return tasks.filter(task => {
      const dueDate = new Date(task.due)
      const timeDiff = dueDate.getTime() - now.getTime()
      const hoursUntilDue = timeDiff / (1000 * 3600)
      
      return (
        task.status === 'in-progress' && 
        hoursUntilDue <= 24 && 
        hoursUntilDue > 0
      )
    })
  }, [tasks])

  const tasksNeedingAttention = getTasksNeedingAttention()
  const overdueTasks = tasks.filter(task => 
    task.status === 'in-progress' && new Date(task.due) < new Date()
  )

  return (
    <div className={`task-status-updater ${className}`}>
      <div className="status-updater-header">
        <div className="update-info">
          <span className="last-update">
            Last checked: {lastUpdateTime.toLocaleTimeString()}
          </span>
          <button
            className="manual-check-btn"
            onClick={checkTaskStatusUpdates}
            disabled={loading || updatingTasks.size > 0}
          >
            {loading || updatingTasks.size > 0 ? (
              <LoadingSpinner size="small" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M1 8C1 8 3 6 8 6C13 6 15 8 15 8C15 8 13 10 8 10C3 10 1 8 1 8Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
            Check Now
          </button>
        </div>

        <div className="auto-update-toggle">
          <label>
            <input
              type="checkbox"
              checked={autoUpdateEnabled}
              onChange={(e) => setAutoUpdateEnabled(e.target.checked)}
            />
            Auto-update
          </label>
        </div>
      </div>

      {(tasksNeedingAttention.length > 0 || overdueTasks.length > 0) && (
        <div className="attention-alerts">
          {overdueTasks.length > 0 && (
            <div className="alert alert-danger">
              <div className="alert-content">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1L15 15H1L8 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6V9M8 12H8.01"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  {overdueTasks.length} task{overdueTasks.length !== 1 ? 's' : ''} overdue
                </span>
              </div>
              <button
                className="bulk-action-btn"
                onClick={() => handleBulkStatusUpdate(
                  overdueTasks.map(task => task._id),
                  'failed'
                )}
                disabled={loading || updatingTasks.size > 0}
              >
                Mark as Failed
              </button>
            </div>
          )}

          {tasksNeedingAttention.length > 0 && (
            <div className="alert alert-warning">
              <div className="alert-content">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M8 4V8L11 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>
                  {tasksNeedingAttention.length} task{tasksNeedingAttention.length !== 1 ? 's' : ''} due within 24 hours
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {updatingTasks.size > 0 && (
        <div className="updating-status">
          <LoadingSpinner size="small" />
          <span>Updating {updatingTasks.size} task{updatingTasks.size !== 1 ? 's' : ''}...</span>
        </div>
      )}
    </div>
  )
}

export default TaskStatusUpdater