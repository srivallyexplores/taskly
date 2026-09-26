import React, { useState, useEffect } from 'react'

// Simple animated checkbox
export const AnimatedCheckbox = ({ checked, onChange, label }) => {
  return (
    <label
      className="animated-checkbox"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        cursor: 'pointer',
        transform: 'scale(1)',
        transition: 'transform 0.1s ease-in-out'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <div
        className="checkbox-container"
        style={{
          width: '20px',
          height: '20px',
          border: '2px solid #007bff',
          borderRadius: '4px',
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: checked ? '#007bff' : 'transparent',
          transition: 'background-color 0.2s ease-in-out'
        }}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              opacity: checked ? 1 : 0,
              transform: checked ? 'scale(1)' : 'scale(0.5)',
              transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out'
            }}
          >
            <path
              d="M2 6L5 9L10 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {label && <span>{label}</span>}
    </label>
  )
}

// Progress bar with animation
export const AnimatedProgressBar = ({ progress, height = 8, color = '#007bff' }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div
      className="progress-container"
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#e9ecef',
        borderRadius: `${height / 2}px`,
        overflow: 'hidden'
      }}
    >
      <div
        className="progress-bar"
        style={{
          height: '100%',
          backgroundColor: color,
          borderRadius: `${height / 2}px`,
          width: `${animatedProgress}%`,
          transition: 'width 0.8s ease-out'
        }}
      />
    </div>
  )
}

// Animated counter
export const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime
    let startValue = displayValue

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const currentValue = Math.floor(startValue + (value - startValue) * progress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span
      style={{
        transform: 'scale(1)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      {displayValue}
    </span>
  )
}

// Shake animation for errors
export const ShakeOnError = ({ children, error }) => {
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    if (error) {
      setIsShaking(true)
      const timer = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div
      style={{
        animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
      }}
    >
      {children}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  )
}

// Pulse animation for notifications
export const PulseNotification = ({ children, active }) => {
  return (
    <div
      style={{
        animation: active ? 'pulse 1s ease-in-out infinite' : 'none'
      }}
    >
      {children}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

// Typewriter effect
export const TypewriterText = ({ text, speed = 50 }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 800)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <span>
      {displayText}
      <span style={{ opacity: showCursor ? 1 : 0 }}>|</span>
    </span>
  )
}

// Simple hover scale effect
export const HoverScale = ({ children, scale = 1.05 }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? `scale(${scale})` : 'scale(1)',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer'
      }}
    >
      {children}
    </div>
  )
}

export default {
  AnimatedCheckbox,
  AnimatedProgressBar,
  AnimatedCounter,
  ShakeOnError,
  PulseNotification,
  TypewriterText,
  HoverScale
}