import React from 'react'
import { formatDistanceToNow, format, isPast } from 'date-fns'
import { 
  UserIcon, 
  UsersIcon, 
  FolderIcon, 
  ChatBubbleLeftIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'
import Avatar from '../common/Avatar'
import Badge from '../common/Badge'
import './TaskCard.css'

const TaskCard = ({ 
  task, 
  onToggleComplete, 
  onEdit, 
  onDelete, 
  onAssign,
  onViewComments,
  showUser = false,
  showCollaboration = true,
  className = '' 
}) => {
  const {
    _id,
    title,
    description,
    due,
    priority,
    status,
    tags = [],
    labels = [],
    user,
    assignee,
    project,
    team,
    comments = [],
    createdAt,
    updatedAt
  } = task

  const dueDate = new Date(due)
  const isOverdue = isPast(dueDate) && status !== 'completed'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high'
      case 'medium': return 'priority-medium'
      case 'low': return 'priority-low'
      default: return ''
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed'
      case 'failed': return 'status-failed'
      case 'in-progress': return 'status-in-progress'
      default: return ''
    }
  }

  const handleToggleComplete = () => {
    if (onToggleComplete && !isFailed) {
      onToggleComplete(_id, !isCompleted)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(_id, title)
    }
  }

  const handleAssign = () => {
    if (onAssign) {
      onAssign(task)
    }
  }

  const handleViewComments = () => {
    if (onViewComments) {
      onViewComments(task)
    }
  }

  return (
    <div className={`task-card ${getStatusClass(status)} ${assignee ? 'has-assignee' : ''} ${comments.length > 0 ? 'has-comments' : ''} ${className}`}>
      <div className="task-card-header">
        <div className="task-title-section">
          <button
            className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
            onClick={handleToggleComplete}
            disabled={isFailed}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <h3 className={`task-title ${isCompleted ? 'completed' : ''}`}>
            {title}
          </h3>
        </div>
        
        <div className="task-actions">
          {showCollaboration && onViewComments && (
            <button
              className="task-action-btn comments-btn"
              onClick={handleViewComments}
              aria-label="View comments"
              title={`${comments.length} comment${comments.length !== 1 ? 's' : ''}`}
            >
              <ChatBubbleLeftIcon className="w-4 h-4" />
              {comments.length > 0 && (
                <span className="comment-count">{comments.length}</span>
              )}
            </button>
          )}
          {showCollaboration && onAssign && (
            <button
              className="task-action-btn assign-btn"
              onClick={handleAssign}
              aria-label="Assign task"
              title="Assign task"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          )}
          <button
            className="task-action-btn edit-btn"
            onClick={handleEdit}
            aria-label="Edit task"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="task-action-btn delete-btn"
            onClick={handleDelete}
            aria-label="Delete task"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4H14M12.5 4V13.5C12.5 14.3284 11.8284 15 11 15H5C4.17157 15 3.5 14.3284 3.5 13.5V4M6.5 1H9.5C10.0523 1 10.5 1.44772 10.5 2V4H5.5V2C5.5 1.44772 5.94772 1 6.5 1Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {description && (
        <p className="task-description">{description}</p>
      )}

      {/* Collaboration Info */}
      {showCollaboration && (assignee || project || team) && (
        <div className="task-collaboration">
          {assignee && (
            <div className="task-assignee">
              <div className="flex items-center space-x-2">
                <Avatar
                  src={assignee.avatar}
                  name={assignee.name}
                  size="xs"
                />
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  {assignee.name}
                </span>
              </div>
            </div>
          )}
          
          {(project || team) && (
            <div className="task-context">
              {project && (
                <div className="flex items-center space-x-1 text-xs text-secondary-600 dark:text-secondary-400">
                  <FolderIcon className="w-3 h-3" />
                  <span>{project.name}</span>
                </div>
              )}
              {team && (
                <div className="flex items-center space-x-1 text-xs text-secondary-600 dark:text-secondary-400">
                  <UsersIcon className="w-3 h-3" />
                  <span>{team.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="task-meta">
        <div className="task-priority">
          <span className={`priority-badge ${getPriorityClass(priority)}`}>
            {priority}
          </span>
        </div>

        <div className="task-due-date">
          <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M11 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V3C12 2.44772 11.5523 2 11 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 1V3M5 1V3M2 5H12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {format(dueDate, 'MMM dd, yyyy')}
          </span>
          {isOverdue && !isCompleted && (
            <span className="overdue-indicator">Overdue</span>
          )}
        </div>
      </div>

      {(tags.length > 0 || labels.length > 0) && (
        <div className="task-tags">
          {tags.map((tag, index) => (
            <span key={`tag-${_id}-${tag}-${index}`} className="task-tag">
              #{tag}
            </span>
          ))}
          {labels.map((label, index) => (
            <span key={`label-${_id}-${label}-${index}`} className="task-label">
              {label}
            </span>
          ))}
        </div>
      )}

      {showUser && user && (
        <div className="task-user">
          <span className="user-name">{user.name || user.username}</span>
        </div>
      )}

      <div className="task-footer">
        <div className="task-status">
          <span className={`status-indicator ${getStatusClass(status)}`}>
            {status === 'in-progress' ? 'In Progress' : 
             status === 'completed' ? 'Completed' : 
             status === 'failed' ? 'Failed' : status}
          </span>
        </div>
        
        {/* Collaboration Stats */}
        {showCollaboration && (
          <div className="task-collaboration-stats">
            {comments.length > 0 && (
              <button
                onClick={handleViewComments}
                className="flex items-center space-x-1 text-xs text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200"
              >
                <ChatBubbleLeftIcon className="w-3 h-3" />
                <span>{comments.length}</span>
              </button>
            )}
            
            {assignee && !showUser && (
              <div className="flex items-center space-x-1 text-xs text-secondary-600 dark:text-secondary-400">
                <UserIcon className="w-3 h-3" />
                <span>Assigned</span>
              </div>
            )}
          </div>
        )}
        
        <div className="task-timestamps">
          <span className="created-at">
            Created {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
          {updatedAt !== createdAt && (
            <span className="updated-at">
              Updated {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard