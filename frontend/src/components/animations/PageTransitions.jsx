import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Simple CSS-based page transition wrapper
export const PageTransition = ({ children, variant = 'default' }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  const transitionStyles = {
    default: {
      transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
      opacity: transitionStage === 'fadeIn' ? 1 : 0,
      transform: transitionStage === 'fadeIn' ? 'translateX(0)' : 'translateX(-20px)'
    },
    fade: {
      transition: 'opacity 0.3s ease-in-out',
      opacity: transitionStage === 'fadeIn' ? 1 : 0
    },
    slide: {
      transition: 'transform 0.3s ease-in-out',
      transform: transitionStage === 'fadeIn' ? 'translateX(0)' : 'translateX(100%)'
    }
  }

  const getStyle = () => {
    switch (variant) {
      case 'fade':
        return transitionStyles.fade
      case 'slide':
        return transitionStyles.slide
      default:
        return transitionStyles.default
    }
  }

  return (
    <div
      style={getStyle()}
      onTransitionEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayLocation(location)
          setTransitionStage('fadeIn')
        }
      }}
    >
      {transitionStage === 'fadeOut' ? children : children}
    </div>
  )
}

// Simple stagger animation for lists
export const StaggerContainer = ({ children, staggerDelay = 100 }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.5s ease-out ${index * staggerDelay}ms, transform 0.5s ease-out ${index * staggerDelay}ms`
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

// Individual item animation for stagger
export const StaggerItem = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
      }}
    >
      {children}
    </div>
  )
}

// Hover animations
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

// Loading animation with CSS
export const LoadingDots = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 3)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-dots" style={{ display: 'flex', gap: '4px' }}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            transform: activeIndex === index ? 'translateY(-10px)' : 'translateY(0)',
            transition: 'transform 0.3s ease-in-out'
          }}
        />
      ))}
    </div>
  )
}

// Card flip animation
export const FlipCard = ({ children, isFlipped = false }) => {
  return (
    <div
      style={{
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.6s ease-in-out',
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </div>
  )
}

// Slide up animation for modals
export const SlideUpModal = ({ children, isOpen }) => {
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    }
  }, [isOpen])

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setShouldRender(false)
    }
  }

  if (!shouldRender) return null

  return (
    <div
      style={{
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        opacity: isOpen ? 1 : 0,
        transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  )
}

export default PageTransition