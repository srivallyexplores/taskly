import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import userService from '../services/userService'
import taskService from '../services/taskService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DocumentHead from '../components/common/DocumentHead'

const TaskDashboard = () => {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const tasksPerPage = 10

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)

        if (user) {
          const userId = user.id || user._id
          const response = await taskService.getUserTasks(userId, currentPage, tasksPerPage)
          setTasks(response.data.tasks || response.data || [])
          setPagination(response.data.pagination || {
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [user, currentPage])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getAvatarUrl = (avatar) => {
    if (!avatar) return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/img/placeholder-user.png`
    if (avatar.startsWith('http')) return avatar
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${avatar}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTaskStatus = (task) => {
    const now = new Date()
    const dueDate = new Date(task.due)
    
    if (task.status === 'completed') return 'completed'
    if (task.status === 'in-progress' && dueDate < now) return 'failed'
    return 'in-progress'
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          borderClass: 'success',
          icon: 'fa fa-check-circle fa-2x text-success me-3',
          badge: 'badge bg-success ms-auto align-self-start px-3 py-2 fs-6',
          badgeText: 'Completed',
          badgeIcon: 'fa fa-check me-1'
        }
      case 'failed':
        return {
          borderClass: 'danger',
          icon: 'fa fa-times-circle fa-2x text-danger me-3',
          badge: 'badge bg-danger ms-auto align-self-start px-3 py-2 fs-6',
          badgeText: 'Failed',
          badgeIcon: 'fa fa-exclamation-triangle me-1'
        }
      default:
        return {
          borderClass: 'info',
          icon: 'fa fa-spinner fa-2x text-info me-3',
          badge: 'badge bg-info text-dark ms-auto align-self-start px-3 py-2 fs-6',
          badgeText: 'In Progress',
          badgeIcon: 'fa fa-hourglass-half me-1'
        }
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.updateTaskStatus(taskId, 'completed')
      // Refresh tasks
      const userId = user.id || user._id
      const response = await taskService.getUserTasks(userId, currentPage, tasksPerPage)
      setTasks(response.data.tasks || response.data || [])
    } catch (err) {
      //console.error('Failed to complete task:', err)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId)
        // Refresh tasks
        const userId = user.id || user._id
        const response = await taskService.getUserTasks(userId, currentPage, tasksPerPage)
        setTasks(response.data.tasks || response.data || [])
      } catch (err) {
        //console.error('Failed to delete task:', err)
      }
    }
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    const pages = []

    if (pagination.hasPreviousPage) {
      pages.push(
        <li key="prev" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
        </li>
      )
    }

    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      )
    }

    if (pagination.hasNextPage) {
      pages.push(
        <li key="next" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </li>
      )
    }

    return (
      <nav className="d-flex justify-content-center mt-5" aria-label="Task pagination">
        <ul className="pagination pagination-lg">
          {pages}
        </ul>
      </nav>
    )
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <p>Please log in to view your tasks.</p>
      </div>
    )
  }

  return (
    <>
      <DocumentHead 
        title="My Tasks - Taskly"
        description="Manage your tasks, track progress, and stay productive with Taskly."
        keywords="tasks, task management, productivity, dashboard"
      />
      
      {/* User Profile */}
      <div className="bloc l-bloc py-5 bg-light" id="bloc-tasks">
        <div className="container bloc-lg bloc-no-padding-lg">
          {/* User Info Section */}
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-5">
            <div className="order-1 order-md-1 me-4 mb-3 mb-md-0">
              <img 
                src={getAvatarUrl(user.avatar)}
                className="img-fluid rounded-circle shadow lazyload"
                alt="User avatar"
                width="180" 
                height="180"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="order-2 order-md-2 ms-md-5 text-center flex-grow-1">
              <h2 className="fw-bold mb-2">{user.fullname}</h2>
              <p className="text-muted mb-1">
                <i className="fa fa-user me-1"></i>Username: 
                <span className="fw-semibold"> {user.username}</span>
              </p>
              <p className="text-muted mb-3">
                <i className="fa fa-calendar me-1"></i>Member Since: 
                <span className="fw-semibold"> {formatDate(user.created_at || user.createdAt)}</span>
              </p>
              <Link 
                to="/tasks/new" 
                className="btn btn-primary btn-lg px-4 mt-2" 
                aria-label="Add Task" 
                title="Add Task"
              >
                <i className="fa fa-plus me-2"></i>Add Task
              </Link>
            </div>
          </div>
          <hr className="my-5" />

          {/* Task Cards Section */}
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="d-flex flex-column gap-4">
                {loading ? (
                  <div className="d-flex justify-content-center">
                    <LoadingSpinner size="large" message="Loading tasks..." />
                  </div>
                ) : error ? (
                  <ErrorMessage message={error} />
                ) : tasks && tasks.length > 0 ? (
                  tasks.map(task => {
                    const dynamicStatus = getTaskStatus(task)
                    const statusConfig = getStatusConfig(dynamicStatus)
                    
                    return (
                      <div 
                        key={task._id || task.id} 
                        className={`card shadow-lg border-0 rounded-4 overflow-hidden glass-card border-start border-5 border-${statusConfig.borderClass}`}
                      >
                        <div className="card-body p-4">
                          <div className="d-flex align-items-center mb-3">
                            {/* Dynamic Status Icon */}
                            <span className={statusConfig.icon}></span>

                            {/* Task Title and Due Date */}
                            <div>
                              <h4 className="card-title mb-1 fw-bold">{task.title}</h4>
                              <small className="text-muted">
                                <i className="fa fa-calendar-alt me-1"></i>
                                Due: {new Date(task.due).toISOString().split('T')[0]}
                              </small>
                            </div>

                            {/* Status Badge */}
                            <span className={statusConfig.badge}>
                              <i className={statusConfig.badgeIcon}></i> {statusConfig.badgeText}
                            </span>
                          </div>

                          {/* Task Description */}
                          <p className="card-text text-muted mb-3">
                            {task.description || 'No description provided.'}
                          </p>

                          {/* Task Tags and Priority */}
                          <div className="mb-3">
                            {task.tags && task.tags.length > 0 && task.tags.map((tag, index) => (
                              <span key={`${task._id}-tag-${tag}-${index}`} className="badge bg-secondary me-1">{tag}</span>
                            ))}

                            {task.priority === 'high' && (
                              <span className="badge bg-danger text-light me-1">
                                <i className="fa fa-arrow-up me-1"></i> High Priority
                              </span>
                            )}
                            {task.priority === 'medium' && (
                              <span className="badge bg-warning text-dark me-1">
                                <i className="fa fa-equals me-1"></i> Medium Priority
                              </span>
                            )}
                            {task.priority === 'low' && (
                              <span className="badge bg-success text-light me-1">
                                <i className="fa fa-arrow-down me-1"></i> Low Priority
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {dynamicStatus === 'in-progress' && (
                            <div className="d-flex justify-content-end gap-2">
                              {/* Edit Button */}
                              <Link 
                                to={`/tasks/${task._id || task.id}/edit`}
                                className="btn btn-outline-primary btn-sm rounded-pill px-3"
                              >
                                <i className="fa fa-edit me-1"></i>Edit
                              </Link>

                              {/* Delete Button */}
                              <button 
                                onClick={() => handleDeleteTask(task._id || task.id)}
                                className="btn btn-outline-danger btn-sm rounded-pill px-3"
                              >
                                <i className="fa fa-trash me-1"></i>Delete
                              </button>

                              {/* Done Button */}
                              <button 
                                onClick={() => handleCompleteTask(task._id || task.id)}
                                className="btn btn-success btn-sm rounded-pill px-3"
                              >
                                <i className="fa fa-check me-1"></i>Done
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-center text-muted">No tasks available. Create a new task to get started!</p>
                )}
              </div>
            </div>
          </div>
          {/* Tasks End */}
        </div>
        
        {/* Pagination */}
        {renderPagination()}
      </div>
    </>
  )
}

export default TaskDashboard