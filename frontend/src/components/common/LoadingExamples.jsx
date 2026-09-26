import React, { useState } from 'react'
import LoadingSpinner, { InlineSpinner, DotsLoader, PulseLoader } from './LoadingSpinner'
import { 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonForm 
} from './SkeletonLoader'
import { LoadingWrapper, LoadingBoundary, LoadingButton } from './WithLoading'
import useLoading from '../../hooks/useLoading'

// Example component demonstrating all loading features
const LoadingExamples = () => {
  const [showExamples, setShowExamples] = useState(false)
  const {
    isLoading,
    startLoading,
    stopLoading,
    startNamedLoading,
    stopNamedLoading,
    isNamedLoading,
    withLoading,
    withMinimumLoading
  } = useLoading()

  const simulateApiCall = () => {
    return new Promise(resolve => setTimeout(resolve, 2000))
  }

  const handleSimpleLoading = async () => {
    await withLoading(simulateApiCall)
  }

  const handleNamedLoading = async (name) => {
    await withLoading(simulateApiCall, name)
  }

  const handleMinimumLoading = async () => {
    await withMinimumLoading(simulateApiCall, 1000)
  }

  if (!showExamples) {
    return (
      <div className="loading-examples-toggle">
        <button 
          onClick={() => setShowExamples(true)}
          className="btn btn-secondary"
        >
          Show Loading Examples
        </button>
      </div>
    )
  }

  return (
    <div className="loading-examples">
      <div className="examples-header">
        <h2>Loading Components Examples</h2>
        <button 
          onClick={() => setShowExamples(false)}
          className="btn btn-secondary"
        >
          Hide Examples
        </button>
      </div>

      {/* Basic Spinners */}
      <section className="example-section">
        <h3>Basic Spinners</h3>
        <div className="spinner-examples">
          <div className="spinner-example">
            <h4>Default Spinner</h4>
            <LoadingSpinner />
          </div>
          
          <div className="spinner-example">
            <h4>Small Spinner</h4>
            <LoadingSpinner size="small" message="Loading..." />
          </div>
          
          <div className="spinner-example">
            <h4>Large Spinner</h4>
            <LoadingSpinner size="large" color="success" />
          </div>
          
          <div className="spinner-example">
            <h4>Inline Spinner</h4>
            <p>Processing <InlineSpinner size="small" /> please wait...</p>
          </div>
        </div>
      </section>

      {/* Alternative Loaders */}
      <section className="example-section">
        <h3>Alternative Loaders</h3>
        <div className="loader-examples">
          <div className="loader-example">
            <h4>Dots Loader</h4>
            <DotsLoader color="primary" size="medium" />
          </div>
          
          <div className="loader-example">
            <h4>Pulse Loader</h4>
            <PulseLoader color="success" size="medium" />
          </div>
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="example-section">
        <h3>Skeleton Loaders</h3>
        <div className="skeleton-examples">
          <div className="skeleton-example">
            <h4>Text Skeleton</h4>
            <SkeletonText lines={3} />
          </div>
          
          <div className="skeleton-example">
            <h4>Avatar Skeleton</h4>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <SkeletonAvatar size="small" />
              <SkeletonAvatar size="medium" />
              <SkeletonAvatar size="large" shape="square" />
            </div>
          </div>
          
          <div className="skeleton-example">
            <h4>Card Skeleton</h4>
            <SkeletonCard hasAvatar={true} hasImage={true} lines={2} />
          </div>
          
          <div className="skeleton-example">
            <h4>List Skeleton</h4>
            <SkeletonList items={3} hasAvatar={true} />
          </div>
          
          <div className="skeleton-example">
            <h4>Table Skeleton</h4>
            <SkeletonTable rows={3} columns={4} />
          </div>
          
          <div className="skeleton-example">
            <h4>Form Skeleton</h4>
            <SkeletonForm fields={3} />
          </div>
        </div>
      </section>

      {/* Loading Wrappers */}
      <section className="example-section">
        <h3>Loading Wrappers</h3>
        <div className="wrapper-examples">
          <div className="wrapper-example">
            <h4>Loading Wrapper</h4>
            <LoadingWrapper 
              isLoading={isLoading}
              skeletonType="card"
              skeletonProps={{ hasAvatar: true, lines: 2 }}
            >
              <div className="example-content">
                <h5>Content loaded!</h5>
                <p>This content is shown when not loading.</p>
              </div>
            </LoadingWrapper>
          </div>
          
          <div className="wrapper-example">
            <h4>Loading Boundary</h4>
            <LoadingBoundary 
              isLoading={isNamedLoading('boundary')}
              fallback={<DotsLoader />}
            >
              <div className="example-content">
                <h5>Boundary content!</h5>
                <p>This uses a loading boundary pattern.</p>
              </div>
            </LoadingBoundary>
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className="example-section">
        <h3>Interactive Examples</h3>
        <div className="interactive-examples">
          <div className="interactive-example">
            <h4>Loading Buttons</h4>
            <div className="button-group">
              <LoadingButton
                isLoading={isLoading}
                onClick={handleSimpleLoading}
                className="btn btn-primary"
              >
                Simple Loading
              </LoadingButton>
              
              <LoadingButton
                isLoading={isNamedLoading('named')}
                onClick={() => handleNamedLoading('named')}
                className="btn btn-success"
                loadingText="Processing..."
              >
                Named Loading
              </LoadingButton>
              
              <LoadingButton
                isLoading={isNamedLoading('minimum')}
                onClick={handleMinimumLoading}
                className="btn btn-info"
              >
                Minimum Loading Time
              </LoadingButton>
            </div>
          </div>
          
          <div className="interactive-example">
            <h4>Manual Controls</h4>
            <div className="button-group">
              <button 
                onClick={() => startNamedLoading('manual')}
                className="btn btn-secondary"
              >
                Start Loading
              </button>
              <button 
                onClick={() => stopNamedLoading('manual')}
                className="btn btn-secondary"
              >
                Stop Loading
              </button>
            </div>
            {isNamedLoading('manual') && (
              <div className="manual-loading">
                <InlineSpinner /> Manual loading active...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overlay Examples */}
      <section className="example-section">
        <h3>Overlay Loading</h3>
        <div className="overlay-examples">
          <div className="overlay-example">
            <h4>Overlay Loading</h4>
            <div style={{ position: 'relative', height: '200px', border: '1px solid #ddd', padding: '1rem' }}>
              <h5>Content with overlay</h5>
              <p>This content can have an overlay loading state.</p>
              <button 
                onClick={() => {
                  startNamedLoading('overlay')
                  setTimeout(() => stopNamedLoading('overlay'), 3000)
                }}
                className="btn btn-primary"
              >
                Show Overlay
              </button>
              
              {isNamedLoading('overlay') && (
                <LoadingSpinner 
                  overlay={true} 
                  message="Loading with overlay..." 
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LoadingExamples