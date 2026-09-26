import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Unauthorized = () => {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const fromPath = location.state?.from || '/'

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h1>403</h1>
          <h2>Access Denied</h2>
          <p>
            {!isAuthenticated 
              ? "You need to be logged in to access this page."
              : "You don't have permission to access this resource."
            }
          </p>
          <div className="unauthorized-actions">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  state={{ from: fromPath }}
                  className="login-button"
                >
                  Login
                </Link>
                <Link to="/" className="home-button">
                  Go Home
                </Link>
              </>
            ) : (
              <>
                <Link to="/" className="home-button">
                  Go Home
                </Link>
                <button onClick={() => window.history.back()} className="back-button">
                  Go Back
                </button>
              </>
            )}
          </div>
          {isAuthenticated && user && (
            <div className="user-info">
              <p>Logged in as: {user.firstName} {user.lastName} ({user.email})</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Unauthorized