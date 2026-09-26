import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import userService from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'
import DocumentHead from '../common/DocumentHead'
import SafeImage from '../common/SafeImage'

const EditProfile = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullname: user?.fullname || '',
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/img/placeholder-user.png`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Predefined avatar options
  const avatarOptions = [
    '/img/placeholder-user.png',
    '/img/avatars/avatar-1.jpg',
    '/img/avatars/avatar-2.jpg',
    '/img/avatars/avatar-3.jpg',
    '/img/avatars/avatar-4.jpg',
    '/img/avatars/avatar-5.jpg',
    '/img/avatars/avatar-6.jpg',
    '/img/avatars/avatar-7.jpg',
    '/img/avatars/avatar-8.jpg',
    '/img/avatars/avatar-9.jpg',
    '/img/avatars/avatar-10.jpg',
    '/img/avatars/avatar-11.jpg',
    '/img/avatars/avatar-12.jpg',
    '/img/avatars/avatar-13.jpg'
  ]

  const handleCancel = () => {
    navigate('/profile')
  }

  if (!user) {
    return (
      <div className="bloc l-bloc py-5 bg-light">
        <div className="container text-center">
          <h1>Edit Profile</h1>
          <p>Please log in to edit your profile.</p>
        </div>
      </div>
    )
  }

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

  const handleAvatarSelect = (avatarUrl) => {
    setSelectedAvatar(avatarUrl)
    setError(null)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.fullname.trim()) {
      errors.fullname = 'Full name is required (min 2 characters)'
    } else if (formData.fullname.trim().length < 2) {
      errors.fullname = 'Full name must be at least 2 characters'
    }

    if (!formData.username.trim()) {
      errors.username = 'Username is required (min 3 characters)'
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters'
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
      const updateData = {
        fullname: formData.fullname.trim(),
        username: formData.username.trim(),
        new_email: formData.email.trim(),
        avatar: selectedAvatar
      }

      // Add password fields if provided
      if (formData.currentPassword) {
        updateData.current_password = formData.currentPassword
      }
      if (formData.newPassword) {
        updateData.new_password = formData.newPassword
      }

      // Update profile data
      const updatedUser = await userService.updateUser(userId, updateData)

      // Update auth context
      if (updateUser) {
        updateUser(updatedUser.data)
      }

      setSuccess('Profile updated successfully!')

      // Navigate back to profile
      setTimeout(() => {
        navigate('/profile')
      }, 2000)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DocumentHead 
        title="Edit Profile - Taskly"
        description="Update your profile information, avatar, and account settings."
        keywords="edit profile, user settings, account management"
      />
      
      {/* Edit Profile Section */}
      <div className="bloc l-bloc py-5 bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-8">
              <div className="card shadow-lg border-0 rounded-4 glass-card">
                <div className="card-header bg-primary text-white text-center py-4 rounded-top-4">
                  <h2 className="mb-0 fw-bold">
                    <i className="fa fa-user-edit me-2"></i>Edit Profile
                  </h2>
                  <p className="mb-0 mt-2 opacity-75">Update your personal information and settings</p>
                </div>
                
                <div className="card-body p-4">
                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                      <i className="fa fa-exclamation-triangle me-2"></i>
                      {error}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                      <i className="fa fa-check-circle me-2"></i>
                      {success}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setSuccess(null)}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Avatar Section */}
                    <div className="mb-5">
                      <div className="text-center">
                        <h4 className="mb-4 text-primary">
                          <i className="fa fa-camera me-2"></i>Profile Photo
                        </h4>
                        <div className="d-flex justify-content-center mb-4">
                          <div className="position-relative">
                            <SafeImage
                              src={selectedAvatar}
                              fallbackSrc="/img/placeholder-user.png"
                              className="rounded-circle shadow-lg"
                              alt="Selected avatar"
                              width="150"
                              height="150"
                              style={{ 
                                objectFit: 'cover', 
                                border: '4px solid #fff',
                                display: 'block',
                                margin: '0 auto'
                              }}
                            />
                            <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-2">
                              <i className="fa fa-camera text-white"></i>
                            </div>
                          </div>
                        </div>
                        <p className="text-muted mb-3">Choose from the avatars below</p>
                      </div>
                      
                      <div className="row justify-content-center">
                        <div className="col-lg-10">
                          <div className="d-flex flex-wrap justify-content-center gap-3">
                            {avatarOptions.map((avatarUrl, index) => (
                              <div key={index} className="position-relative">
                                <SafeImage
                                  src={avatarUrl}
                                  fallbackSrc="/img/placeholder-user.png"
                                  className={`rounded-circle shadow-sm ${selectedAvatar === avatarUrl ? 'border border-primary border-3' : 'border border-light border-2'}`}
                                  alt={`Avatar ${index + 1}`}
                                  width="70"
                                  height="70"
                                  style={{ 
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    transform: selectedAvatar === avatarUrl ? 'scale(1.1)' : 'scale(1)'
                                  }}
                                  onClick={() => handleAvatarSelect(avatarUrl)}
                                />
                                {selectedAvatar === avatarUrl && (
                                  <div className="position-absolute top-0 end-0 bg-primary rounded-circle p-1">
                                    <i className="fa fa-check text-white" style={{ fontSize: '0.7rem' }}></i>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="row mb-4">
                      <div className="col-12 mb-4">
                        <h4 className="text-primary border-bottom pb-2">
                          <i className="fa fa-user me-2"></i>Personal Information
                        </h4>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold" htmlFor="fullname">
                          <i className="fa fa-id-card text-primary me-2"></i>Full Name
                        </label>
                        <input 
                          id="fullname" 
                          className={`form-control form-control-lg shadow-sm ${validationErrors.fullname ? 'is-invalid' : ''}`}
                          name="fullname"
                          value={formData.fullname}
                          onChange={handleInputChange}
                          placeholder="Enter your full name" 
                          disabled={loading}
                        />
                        {validationErrors.fullname && (
                          <div className="invalid-feedback">{validationErrors.fullname}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold" htmlFor="username">
                          <i className="fa fa-at text-primary me-2"></i>Username
                        </label>
                        <input 
                          id="username" 
                          className={`form-control form-control-lg shadow-sm ${validationErrors.username ? 'is-invalid' : ''}`}
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Enter your username" 
                          disabled={loading}
                        />
                        {validationErrors.username && (
                          <div className="invalid-feedback">{validationErrors.username}</div>
                        )}
                      </div>
                      
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold" htmlFor="email">
                          <i className="fa fa-envelope text-primary me-2"></i>Email Address
                        </label>
                        <input 
                          id="email" 
                          className={`form-control form-control-lg shadow-sm ${validationErrors.email ? 'is-invalid' : ''}`}
                          name="email" 
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email address"
                          disabled={loading}
                        />
                        {validationErrors.email && (
                          <div className="invalid-feedback">{validationErrors.email}</div>
                        )}
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="row mb-4">
                      <div className="col-12 mb-4">
                        <h4 className="text-primary border-bottom pb-2">
                          <i className="fa fa-lock me-2"></i>Change Password
                          <small className="text-muted ms-2">(Optional)</small>
                        </h4>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold" htmlFor="current_password">
                          <i className="fa fa-key text-primary me-2"></i>Current Password
                        </label>
                        <input 
                          id="current_password" 
                          className="form-control form-control-lg shadow-sm" 
                          name="currentPassword"
                          type="password" 
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                          placeholder="Enter current password to change it" 
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold" htmlFor="new_password">
                          <i className="fa fa-shield-alt text-primary me-2"></i>New Password
                        </label>
                        <input 
                          id="new_password" 
                          className={`form-control form-control-lg shadow-sm ${validationErrors.newPassword ? 'is-invalid' : ''}`}
                          name="newPassword"
                          type="password" 
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="Enter new password" 
                          disabled={loading}
                        />
                        <small className="text-muted">Minimum 6 characters</small>
                        {validationErrors.newPassword && (
                          <div className="invalid-feedback">{validationErrors.newPassword}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold" htmlFor="confirm_password">
                          <i className="fa fa-check-circle text-primary me-2"></i>Confirm Password
                        </label>
                        <input 
                          id="confirm_password" 
                          className={`form-control form-control-lg shadow-sm ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirm new password"
                          disabled={loading}
                        />
                        {validationErrors.confirmPassword && (
                          <div className="invalid-feedback">{validationErrors.confirmPassword}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Form Actions */}
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4 pt-3 border-top">
                      <button 
                        className="btn btn-lg px-4" 
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        style={{
                          backgroundColor: '#6c757d',
                          borderColor: '#6c757d',
                          color: 'white'
                        }}
                      >
                        <i className="fa fa-times me-2"></i>Cancel
                      </button>
                      <button 
                        className="btn btn-primary btn-lg px-4" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <LoadingSpinner size="small" />
                            <span className="ms-2">Saving...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa fa-save me-2"></i>Save Changes
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

export default EditProfile