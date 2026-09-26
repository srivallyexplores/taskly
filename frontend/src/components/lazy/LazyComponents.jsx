import React, { Suspense } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'

// Lazy load heavy components
const LazyUserProfile = React.lazy(() => import('../user/UserProfile'))
const LazyEditProfile = React.lazy(() => import('../user/EditProfile'))
const LazyTaskList = React.lazy(() => import('../task/TaskList'))
const LazyTaskForm = React.lazy(() => import('../task/TaskForm'))
const LazyUserStatsDashboard = React.lazy(() => import('../user/UserStatsDashboard'))

// Wrapper component with suspense
const LazyComponentWrapper = ({ children, fallback }) => (
  <Suspense fallback={fallback || <LoadingSpinner size="large" message="Loading..." />}>
    {children}
  </Suspense>
)

// Lazy component exports with suspense wrappers
export const LazyUserProfileWithSuspense = (props) => (
  <LazyComponentWrapper>
    <LazyUserProfile {...props} />
  </LazyComponentWrapper>
)

export const LazyEditProfileWithSuspense = (props) => (
  <LazyComponentWrapper>
    <LazyEditProfile {...props} />
  </LazyComponentWrapper>
)

export const LazyTaskListWithSuspense = (props) => (
  <LazyComponentWrapper>
    <LazyTaskList {...props} />
  </LazyComponentWrapper>
)

export const LazyTaskFormWithSuspense = (props) => (
  <LazyComponentWrapper>
    <LazyTaskForm {...props} />
  </LazyComponentWrapper>
)

export const LazyUserStatsDashboardWithSuspense = (props) => (
  <LazyComponentWrapper>
    <LazyUserStatsDashboard {...props} />
  </LazyComponentWrapper>
)

// Image lazy loading component
export const LazyImage = ({ src, alt, className, width, height, ...props }) => {
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const imgRef = React.useRef()

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image()
          img.onload = () => setLoaded(true)
          img.onerror = () => setError(true)
          img.src = src
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [src])

  return (
    <div ref={imgRef} className={`lazy-image-container ${className || ''}`} {...props}>
      {!loaded && !error && (
        <div 
          className="lazy-image-placeholder"
          style={{ 
            width: width || '100%', 
            height: height || '200px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LoadingSpinner size="small" />
        </div>
      )}
      {loaded && (
        <img
          src={src}
          alt={alt}
          className={className}
          width={width}
          height={height}
          loading="lazy"
          {...props}
        />
      )}
      {error && (
        <div 
          className="lazy-image-error"
          style={{ 
            width: width || '100%', 
            height: height || '200px',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d'
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  )
}

export default LazyComponentWrapper