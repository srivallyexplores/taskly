import React, { useState, useEffect } from 'react'

const DevelopmentNotice = () => {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    // Check if we're in development mode and backend is not available
    const isDevelopment = import.meta.env.DEV
    const hasShownNotice = localStorage.getItem('dev-notice-shown')
    
    if (isDevelopment && !hasShownNotice) {
      // Check if backend is available
      fetch('http://localhost:5000/api/health')
        .catch(() => {
          setShowNotice(true)
        })
    }
  }, [])

  const handleDismiss = () => {
    setShowNotice(false)
    localStorage.setItem('dev-notice-shown', 'true')
  }

  if (!showNotice) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ color: '#856404', fontSize: '20px' }}> </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px' }}>
            Development Mode
          </h4>
          <p style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '14px', lineHeight: '1.4' }}>
            Backend server is not running. Using mock data for demonstration. 
            Start the backend server for full functionality.
          </p>
          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: '#856404',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#856404',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default DevelopmentNotice