import React from 'react'
import { Link } from 'react-router-dom'
import DocumentHead from '../components/common/DocumentHead'

const NotFound = () => {
  return (
    <>
      <DocumentHead 
        title="404 - Page Not Found | Taskly"
        description="The page you're looking for doesn't exist or has been moved."
        keywords="404, page not found, error"
      />
      
      <div className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '80vh' }}>
        <div className="text-center p-4 rounded shadow" style={{ background: '#fff', maxWidth: '500px', width: '100%' }}>
          <h1 className="display-4 mb-2 text-danger">404</h1>
          <h2 className="mb-3">Page Not Found</h2>
          <p className="mb-3">The page you're looking for doesn't exist or has been moved.</p>
          <div className="d-flex gap-2 justify-content-center">
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-outline-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound