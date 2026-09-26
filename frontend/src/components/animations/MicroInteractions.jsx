import React, { useState, useEffect, useRef } from 'react'

// Button with ripple effect
export const RippleButton = ({ children, onClick, className, ...props }) => {
  const [ripples, setRipples] = useState([])
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    }

    setRipples(prev => [...prev, newRipple])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    if (onClick) onClick(e)
  }

  return (
    <button
      className={`ripple-button ${className || ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        transform: `scale(${isPressed ? 0.98 : isHovered ? 1.02 : 1})`,
        transition: 'transform 0.1s ease-in-out'
      }}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            pointerEvents: 'none',
            animation: 'ripple-animation 0.6s ease-out forwards'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple-animation {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  )
}

// Floating action button
export const FloatingActionButton = ({ children, onClick, className }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <button
      className={`fab ${className || ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 1000,
        transform: `scale(${isVisible ? (isHovered ? 1.1 : 1) : 0})`,
        boxShadow: isHovered ? '0 8px 25px rgba(0, 123, 255, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.2s ease-in-out'
      }}
    >
      {children}
    </button>
  )
}

// Animated checkbox
export const AnimatedCheckbox = ({ checked, onChange, label }) => {
  const checkmarkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1 }
  }

  return (
    <motion.label
      className="animated-checkbox"
      whileHover={{ scale: 1.05 }}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    >
      <motion.div
        className="checkbox-container"
        style={{
          width: '20px',
          height: '20px',
          border: '2px solid #007bff',
          borderRadius: '4px',
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        animate={{
          backgroundColor: checked ? '#007bff' : 'transparent'
        }}
        transition={{ duration: 0.2 }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <motion.path
            d="M2 6L5 9L10 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkmarkVariants}
            initial="hidden"
            animate={checked ? "visible" : "hidden"}
            transition={{ duration: 0.3 }}
          />
        </svg>
      </motion.div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {label && <span>{label}</span>}
    </motion.label>
  )
}

// Progress bar with animation
export const AnimatedProgressBar = ({ progress, height = 8, color = '#007bff' }) => {
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
      <motion.div
        className="progress-bar"
        style={{
          height: '100%',
          backgroundColor: color,
          borderRadius: `${height / 2}px`
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

// Animated counter
export const AnimatedCounter = ({ value, duration = 1 }) => {
  const controls = useAnimation()
  const [displayValue, setDisplayValue] = useState(0)

  React.useEffect(() => {
    let startTime
    let startValue = displayValue

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      const currentValue = Math.floor(startValue + (value - startValue) * progress)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <motion.span
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  )
}

// Shake animation for errors
export const ShakeOnError = ({ children, error }) => {
  const controls = useAnimation()

  React.useEffect(() => {
    if (error) {
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      })
    }
  }, [error, controls])

  return (
    <motion.div animate={controls}>
      {children}
    </motion.div>
  )
}

// Pulse animation for notifications
export const PulseNotification = ({ children, active }) => {
  return (
    <motion.div
      animate={active ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      } : {}}
      transition={{
        duration: 1,
        repeat: active ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Typewriter effect
export const TypewriterText = ({ text, speed = 50 }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </span>
  )
}

export default {
  RippleButton,
  FloatingActionButton,
  AnimatedCheckbox,
  AnimatedProgressBar,
  AnimatedCounter,
  ShakeOnError,
  PulseNotification,
  TypewriterText
}