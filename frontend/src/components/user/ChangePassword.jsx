import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import userService from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'
import SuccessMessage from '../common/SuccessMessage'

const ChangePassword = ({ onCancel, onSuccess }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required'
    }
    
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password'
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
      
      const userId = user?.id || user?._id
      
      await userService.updatePassword(userId, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      setSuccess('Password changed successfully!')
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        }
      }, 2000)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="change-password">
      <div className="change-password-header">
        <h2>Change Password</h2>
        <p>Enter your current password and choose a new one.</p>
      </div>

      {error && (
        <ErrorMessage 
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <SuccessMessage 
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="change-password-form">
        {/* Current Password */}
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password *</label>
          <div className="password-input-container">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className={validationErrors.currentPassword ? 'error' : ''}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              disabled={loading}
            >
              {showPasswords.current ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationErrors.currentPassword && (
            <span className="error-text">{validationErrors.currentPassword}</span>
          )}
        </div>

        {/* New Password */}
        <div className="form-group">
          <label htmlFor="newPassword">New Password *</label>
          <div className="password-input-container">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={validationErrors.newPassword ? 'error' : ''}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              disabled={loading}
            >
              {showPasswords.new ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationErrors.newPassword && (
            <span className="error-text">{validationErrors.newPassword}</span>
          )}
          <p className="password-help">
            Password must be at least 6 characters long.
          </p>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password *</label>
          <div className="password-input-container">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={validationErrors.confirmPassword ? 'error' : ''}
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              disabled={loading}
            >
              {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <span className="error-text">{validationErrors.confirmPassword}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" message="" /> : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChangePassword