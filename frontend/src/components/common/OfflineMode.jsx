import React from 'react'

const OfflineMode = () => {
  return (
    <div className="bloc l-bloc py-5 bg-light" style={{ minHeight: '100vh' }}>
      <div className="container">
        <div className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0 rounded-4 p-4 text-center">
              <div className="mb-4">
                <i className="fa fa-server fa-4x text-warning mb-3"></i>
                <h2 className="fw-bold text-dark">Backend Server Unavailable</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-muted mb-3">
                  The Taskly backend server is currently not running or unavailable.
                </p>
                <p className="text-muted mb-3">
                  To use the application, please start the backend server:
                </p>
                
                <div className="bg-dark text-light p-3 rounded mb-3 text-start">
                  <code>
                    cd backend<br/>
                    npm run dev
                  </code>
                </div>
                
                <p className="text-muted small">
                  The backend should be running on <strong>http://localhost:5000</strong>
                </p>
              </div>
              
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-primary px-4"
                >
                  <i className="fa fa-refresh me-2"></i>
                  Retry Connection
                </button>
                <a 
                  href="/" 
                  className="btn btn-outline-secondary px-4"
                >
                  <i className="fa fa-home me-2"></i>
                  Go Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OfflineMode