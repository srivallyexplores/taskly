import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import taskService from '../services/taskService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import DocumentHead from '../components/common/DocumentHead'

const AddTask = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due: new Date().toISOString().split('T')[0], // Today's date
    priority: ''
  })
  const [tags, setTags] = useState(['work'])
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handlePriorityChange = (priority) => {
    setFormData(prev => ({
      ...prev,
      priority
    }))

    if (validationErrors.priority) {
      setValidationErrors(prev => ({
        ...prev,
        priority: null
      }))
    }
  }

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!tags.includes(newTag)) {
        setTags(prev => [...prev, newTag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const quickDate = (option) => {
    const today = new Date()
    let targetDate = new Date(today)

    switch (option) {
      case 'today':
        break
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1)
        break
      case 'nextweek':
        targetDate.setDate(today.getDate() + 7)
        break
      default:
        break
    }

    setFormData(prev => ({
      ...prev,
      due: targetDate.toISOString().split('T')[0]
    }))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Task Title is required.'
    }

    if (!formData.due) {
      errors.due = 'Due Date is required.'
    } else {
      const dueDate = new Date(formData.due)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        errors.due = 'Due date cannot be in the past.'
      }
    }

    if (!formData.priority) {
      errors.priority = 'Priority is required.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        due: formData.due,
        priority: formData.priority,
        tags
      }

      const response = await taskService.createTask(taskData)
      
      // Navigate back to profile
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(-1) // Go back to previous page
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <p>Please log in to create tasks.</p>
      </div>
    )
  }

  return (
    <>
      <DocumentHead 
        title="Add New Task - Taskly"
        description="Create a new task to stay organized and productive."
        keywords="add task, create task, task management, productivity"
      />
      
      {/* Add Task Section */}
      <div className="bloc l-bloc py-5" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7">
              {/* Header Card */}
              <div className="text-center mb-4">
                <div className="card border-0 shadow-lg rounded-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="card-body py-4">
                    <h1 className="text-white mb-2 fw-bold">
                      <i className="fa fa-plus-circle me-3"></i>Create New Task
                    </h1>
                    <p className="text-white-50 mb-0 fs-5">Stay organized and boost your productivity</p>
                  </div>
                </div>
              </div>

              {/* Main Form Card */}
              <div className="card border-0 shadow-lg rounded-4" style={{ backgroundColor: '#ffffff' }}>
                <div className="card-body p-5">
                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      <strong>Error:</strong> {error}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Task Title */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark mb-3" htmlFor="task-title">
                        <i className="fa fa-heading text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                        Task Title <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className={`form-control form-control-lg border-2 ${validationErrors.title ? 'is-invalid border-danger' : 'border-light'}`}
                        id="task-title" 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="What needs to be done?" 
                        autoFocus
                        disabled={loading}
                        style={{ 
                          fontSize: '1.1rem',
                          padding: '15px 20px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      />
                      {validationErrors.title && (
                        <div className="invalid-feedback fw-semibold">{validationErrors.title}</div>
                      )}
                    </div>
                    
                    {/* Task Description */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark mb-3" htmlFor="task-desc">
                        <i className="fa fa-align-left text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                        Description
                      </label>
                      <textarea 
                        className="form-control border-2 border-light" 
                        id="task-desc" 
                        name="description" 
                        rows="4"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Add more details about this task..."
                        disabled={loading}
                        style={{ 
                          fontSize: '1rem',
                          padding: '15px 20px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    
                    {/* Due Date */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark mb-3" htmlFor="due-date">
                        <i className="fa fa-calendar-alt text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                        Due Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control form-control-lg border-2 ${validationErrors.due ? 'is-invalid border-danger' : 'border-light'}`}
                        id="due-date"
                        name="due"
                        value={formData.due}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={loading}
                        style={{ 
                          fontSize: '1.1rem',
                          padding: '15px 20px',
                          borderRadius: '12px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                        }}
                      />
                      {validationErrors.due && (
                        <div className="invalid-feedback fw-semibold">{validationErrors.due}</div>
                      )}
                      <div className="mt-3">
                        <small className="text-muted fw-semibold d-block mb-2">Quick select:</small>
                        <div className="d-flex gap-2 flex-wrap">
                          <button 
                            type="button" 
                            className="btn btn-primary rounded-pill px-4 py-2"
                            onClick={() => quickDate('today')}
                            disabled={loading}
                            style={{ 
                              fontWeight: '600',
                              backgroundColor: '#0d6efd',
                              borderColor: '#0d6efd',
                              color: 'white'
                            }}
                          >
                            <i className="fa fa-clock me-2"></i>Today
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary rounded-pill px-4 py-2"
                            onClick={() => quickDate('tomorrow')}
                            disabled={loading}
                            style={{ 
                              fontWeight: '600',
                              backgroundColor: '#0d6efd',
                              borderColor: '#0d6efd',
                              color: 'white'
                            }}
                          >
                            <i className="fa fa-sun me-2"></i>Tomorrow
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary rounded-pill px-4 py-2"
                            onClick={() => quickDate('nextweek')}
                            disabled={loading}
                            style={{ 
                              fontWeight: '600',
                              backgroundColor: '#0d6efd',
                              borderColor: '#0d6efd',
                              color: 'white'
                            }}
                          >
                            <i className="fa fa-calendar-week me-2"></i>Next Week
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Priority */}
                    <div className="mb-4">
                      <label className="form-label fw-bold text-dark mb-3">
                        <i className="fa fa-flag text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                        Priority <span className="text-danger">*</span>
                      </label>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <div 
                            className={`priority-button ${formData.priority === 'low' ? 'selected' : ''}`}
                            onClick={() => handlePriorityChange('low')}
                            style={{
                              cursor: 'pointer',
                              padding: '20px',
                              borderRadius: '12px',
                              border: '2px solid #198754',
                              backgroundColor: formData.priority === 'low' ? '#198754' : '#ffffff',
                              color: formData.priority === 'low' ? '#ffffff' : '#198754',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              boxShadow: formData.priority === 'low' ? '0 4px 15px rgba(40, 167, 69, 0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
                              fontWeight: '600',
                              fontSize: '1rem'
                            }}
                          >
                            <i className="fa fa-arrow-down d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                            Low Priority
                          </div>
                        </div>
                        
                        <div className="col-md-4">
                          <div 
                            className={`priority-button ${formData.priority === 'medium' ? 'selected' : ''}`}
                            onClick={() => handlePriorityChange('medium')}
                            style={{
                              cursor: 'pointer',
                              padding: '20px',
                              borderRadius: '12px',
                              border: '2px solid #ffc107',
                              backgroundColor: formData.priority === 'medium' ? '#ffc107' : '#ffffff',
                              color: formData.priority === 'medium' ? '#000000' : '#ffc107',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              boxShadow: formData.priority === 'medium' ? '0 4px 15px rgba(255, 193, 7, 0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
                              fontWeight: '600',
                              fontSize: '1rem'
                            }}
                          >
                            <i className="fa fa-equals d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                            Medium Priority
                          </div>
                        </div>
                        
                        <div className="col-md-4">
                          <div 
                            className={`priority-button ${formData.priority === 'high' ? 'selected' : ''}`}
                            onClick={() => handlePriorityChange('high')}
                            style={{
                              cursor: 'pointer',
                              padding: '20px',
                              borderRadius: '12px',
                              border: '2px solid #dc3545',
                              backgroundColor: formData.priority === 'high' ? '#dc3545' : '#ffffff',
                              color: formData.priority === 'high' ? '#ffffff' : '#dc3545',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              boxShadow: formData.priority === 'high' ? '0 4px 15px rgba(220, 53, 69, 0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
                              fontWeight: '600',
                              fontSize: '1rem'
                            }}
                          >
                            <i className="fa fa-arrow-up d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                            High Priority
                          </div>
                        </div>
                      </div>
                      {validationErrors.priority && (
                        <div className="text-danger fw-semibold mt-2">
                          <i className="fa fa-exclamation-circle me-1"></i>
                          {validationErrors.priority}
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    <div className="mb-5">
                      <label className="form-label fw-bold text-dark mb-3">
                        <i className="fa fa-tags text-primary me-2" style={{ fontSize: '1.2rem' }}></i>
                        Tags
                      </label>
                      <div className="mb-3">
                        {tags.map((tag, index) => (
                          <span 
                            key={`tag-${tag}-${index}`} 
                            className="badge me-2 mb-2 px-3 py-2 fs-6 rounded-pill d-inline-flex align-items-center"
                            style={{ 
                              backgroundColor: '#6c757d',
                              color: 'white',
                              fontSize: '0.9rem !important'
                            }}
                          >
                            <i className="fa fa-tag me-1"></i>
                            {tag}
                            <button 
                              type="button" 
                              className="btn btn-sm ms-2 p-0" 
                              aria-label="Remove tag"
                              onClick={() => removeTag(tag)}
                              disabled={loading}
                              style={{ 
                                fontSize: '0.7rem',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="input-group" style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <span className="input-group-text border-2 border-light" style={{ borderRadius: '12px 0 0 12px', padding: '15px 20px' }}>
                          <i className="fa fa-plus text-primary"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control border-2 border-light" 
                          placeholder="Add a tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagInputKeyPress}
                          disabled={loading}
                          style={{ 
                            fontSize: '1rem',
                            padding: '15px 20px',
                            borderRadius: '0 12px 12px 0'
                          }}
                        />
                      </div>
                      <small className="form-text text-muted mt-2 fw-semibold">
                        <i className="fa fa-info-circle me-1"></i>
                        Press Enter to add tags. Use tags to organize your tasks.
                      </small>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="d-flex gap-3 justify-content-end pt-4 border-top">
                      <button 
                        className="btn btn-lg px-5 py-3 rounded-pill" 
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        style={{ 
                          fontWeight: '600', 
                          fontSize: '1rem',
                          backgroundColor: '#6c757d',
                          borderColor: '#6c757d',
                          color: 'white'
                        }}
                      >
                        <i className="fa fa-times me-2"></i>Cancel
                      </button>
                      <button 
                        className="btn btn-lg px-5 py-3 rounded-pill text-white" 
                        type="submit"
                        disabled={loading}
                        style={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          fontWeight: '600',
                          fontSize: '1rem',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="small" />
                            <span className="ms-2">Creating...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-plus me-2"></i>Create Task
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddTask