import React, { useEffect, useState } from 'react'

const FlashNotification = ({ 
  type, 
  message, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isShowing, setIsShowing] = useState(false)

  useEffect(() => {
    // Trigger show animation
    const showTimer = setTimeout(() => {
      setIsShowing(true)
    }, 10)

    // Auto close if enabled
    if (autoClose && duration > 0) {
      const closeTimer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(closeTimer)
      }
    }

    return () => clearTimeout(showTimer)
  }, [autoClose, duration])

  const handleClose = () => {
    setIsShowing(false)
    setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        onClose()
      }
    }, 150) // Bootstrap fade transition duration
  }

  if (!isVisible) {
    return null
  }

  const getAlertClass = () => {
    switch (type) {
      case 'success':
        return 'alert-success'
      case 'error':
      case 'danger':
        return 'alert-danger'
      case 'warning':
        return 'alert-warning'
      case 'info':
        return 'alert-info'
      default:
        return 'alert-info'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fa fa-check-circle me-2"></i>
      case 'error':
      case 'danger':
        return <i className="fa fa-exclamation-triangle me-2"></i>
      case 'warning':
        return <i className="fa fa-exclamation-circle me-2"></i>
      case 'info':
        return <i className="fa fa-info-circle me-2"></i>
      default:
        return <i className="fa fa-info-circle me-2"></i>
    }
  }

  return (
    <div 
      className={`alert ${getAlertClass()} alert-dismissible fade ${isShowing ? 'show' : ''} mb-2 shadow-sm`} 
      role="alert"
    >
      {getIcon()}
      {message}
      <button 
        type="button" 
        className="btn-close" 
        onClick={handleClose}
        aria-label="Close"
      ></button>
    </div>
  )
}

export default FlashNotification