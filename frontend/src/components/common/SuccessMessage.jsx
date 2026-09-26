import React, { useEffect, useState } from 'react'

const SuccessMessage = ({ 
  message, 
  duration = 5000, 
  onClose, 
  className = '',
  showIcon = true 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) {
          setTimeout(onClose, 300) // Allow fade out animation
        }
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      setTimeout(onClose, 300) // Allow fade out animation
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={`success-message ${className} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="success-content">
        {showIcon && (
          <div className="success-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
        <p className="success-text">{message}</p>
        <button 
          onClick={handleClose}
          className="success-close"
          aria-label="Close notification"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default SuccessMessage