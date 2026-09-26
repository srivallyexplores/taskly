import React from 'react'
import LoadingSpinner from '../common/LoadingSpinner'

const TaskDeleteConfirmation = ({
  task,
  onConfirm,
  onCancel,
  loading = false,
  className = ''
}) => {
  if (!task) return null

  const handleConfirm = () => {
    if (onConfirm && !loading) {
      onConfirm(task._id || task.id)
    }
  }

  const handleCancel = () => {
    if (onCancel && !loading) {
      onCancel()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter') {
      handleConfirm()
    }
  }

  return (
    <div className={`task-delete-confirmation ${className}`}>
      <div className="confirmation-overlay" onClick={handleCancel} />
      <div 
        className="confirmation-dialog"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
      >
        <div className="confirmation-header">
          <div className="warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 id="delete-title">Delete Task</h3>
          <button
            type="button"
            className="close-btn"
            onClick={handleCancel}
            disabled={loading}
            aria-label="Close dialog"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="confirmation-content">
          <p id="delete-description">
            Are you sure you want to delete the task <strong>"{task.title}"</strong>?
          </p>
          <p className="warning-text">
            This action cannot be undone. The task and all its data will be permanently removed.
          </p>

          {task.status === 'completed' && (
            <div className="completion-warning">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>This completed task will be removed from your statistics.</span>
            </div>
          )}

          <div className="task-details">
            <div className="detail-item">
              <span className="detail-label">Priority:</span>
              <span className={`priority-badge priority-${task.priority}`}>
                {task.priority}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge status-${task.status}`}>
                {task.status === 'in-progress' ? 'In Progress' : 
                 task.status === 'completed' ? 'Completed' : 
                 task.status === 'failed' ? 'Failed' : task.status}
              </span>
            </div>
            {task.due && (
              <div className="detail-item">
                <span className="detail-label">Due:</span>
                <span className="due-date">
                  {new Date(task.due).toLocaleDateString()}
                </span>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="detail-item">
                <span className="detail-label">Tags:</span>
                <div className="tags-list">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={loading}
            autoFocus
          >
            {loading ? (
              <>
                <LoadingSpinner size="small" />
                Deleting...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4H14M12.5 4V13.5C12.5 14.3284 11.8284 15 11 15H5C4.17157 15 3.5 14.3284 3.5 13.5V4M6.5 1H9.5C10.0523 1 10.5 1.44772 10.5 2V4H5.5V2C5.5 1.44772 5.94772 1 6.5 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Delete Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskDeleteConfirmation