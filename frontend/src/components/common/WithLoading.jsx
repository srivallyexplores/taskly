import React from 'react'
import LoadingSpinner from './LoadingSpinner'
import { SkeletonCard, SkeletonList, SkeletonTable, SkeletonForm } from './SkeletonLoader'

// Higher-order component for adding loading states
const withLoading = (WrappedComponent, options = {}) => {
  const {
    loadingComponent: CustomLoadingComponent,
    skeletonType = 'spinner',
    skeletonProps = {},
    loadingProps = {}
  } = options

  return function WithLoadingComponent(props) {
    const { isLoading, ...restProps } = props

    if (isLoading) {
      // Use custom loading component if provided
      if (CustomLoadingComponent) {
        return <CustomLoadingComponent {...loadingProps} />
      }

      // Use skeleton loaders based on type
      switch (skeletonType) {
        case 'card':
          return <SkeletonCard {...skeletonProps} />
        case 'list':
          return <SkeletonList {...skeletonProps} />
        case 'table':
          return <SkeletonTable {...skeletonProps} />
        case 'form':
          return <SkeletonForm {...skeletonProps} />
        case 'spinner':
        default:
          return <LoadingSpinner {...loadingProps} />
      }
    }

    return <WrappedComponent {...restProps} />
  }
}

// Loading wrapper component
export const LoadingWrapper = ({ 
  isLoading, 
  children, 
  loadingComponent,
  skeletonType = 'spinner',
  skeletonProps = {},
  loadingProps = {},
  overlay = false
}) => {
  if (!isLoading) {
    return children
  }

  const loadingElement = (() => {
    if (loadingComponent) {
      return loadingComponent
    }

    switch (skeletonType) {
      case 'card':
        return <SkeletonCard {...skeletonProps} />
      case 'list':
        return <SkeletonList {...skeletonProps} />
      case 'table':
        return <SkeletonTable {...skeletonProps} />
      case 'form':
        return <SkeletonForm {...skeletonProps} />
      case 'spinner':
      default:
        return <LoadingSpinner overlay={overlay} {...loadingProps} />
    }
  })()

  if (overlay) {
    return (
      <div className="loading-wrapper-overlay">
        {children}
        {loadingElement}
      </div>
    )
  }

  return loadingElement
}

// Suspense-like loading boundary
export const LoadingBoundary = ({ 
  isLoading, 
  children, 
  fallback,
  error,
  errorFallback 
}) => {
  if (error) {
    return errorFallback || (
      <div className="loading-error">
        <p>Failed to load content</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  if (isLoading) {
    return fallback || <LoadingSpinner />
  }

  return children
}

// Loading state for buttons
export const LoadingButton = ({ 
  isLoading, 
  children, 
  loadingText = 'Loading...',
  disabled,
  className = '',
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'loading' : ''}`}
    >
      {isLoading ? (
        <>
          <span className="loading-button-spinner">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}

export default withLoading