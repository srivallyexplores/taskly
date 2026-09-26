import React, { useState, useEffect } from 'react'
import userService from '../../services/userService'
import UserCard from './UserCard'
import LoadingSpinner, { InlineSpinner } from '../common/LoadingSpinner'
import { SkeletonCard } from '../common/SkeletonLoader'
import ErrorMessage from '../common/ErrorMessage'

const UserList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [searchLoading, setSearchLoading] = useState(false)

  const usersPerPage = 12

  const fetchUsers = async (page = 1, search = '') => {
    try {
      const isSearching = search.trim() !== ''
      setLoading(!isSearching)
      setSearchLoading(isSearching)
      setError(null)

      const response = await userService.getUsers(page, usersPerPage, search)
      
      setUsers(response.data.users || response.data || [])
      setPagination(response.data.pagination || {
        totalPages: 1,
        totalItems: response.data.length || 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage, searchQuery)
  }, [currentPage])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers(1, searchQuery)
  }

  const handleSearchInputChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Auto-search after user stops typing for 500ms
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      if (value !== searchQuery) {
        setCurrentPage(1)
        fetchUsers(1, value)
      }
    }, 500)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setCurrentPage(1)
    fetchUsers(1, '')
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!pagination.hasPreviousPage}
        className="pagination-btn"
      >
        ← Previous
      </button>
    )

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>)
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      )
    }

    // Last page and ellipsis
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>)
      }
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
          className="pagination-btn"
        >
          {pagination.totalPages}
        </button>
      )
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!pagination.hasNextPage}
        className="pagination-btn"
      >
        Next →
      </button>
    )

    return (
      <div className="pagination">
        {pages}
      </div>
    )
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h1>All Users</h1>
        <p>Browse and search through all registered users</p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-btn" disabled={searchLoading}>
            {searchLoading ? <InlineSpinner size="small" /> : ' '}
          </button>
        </form>
      </div>

      {/* Results Info */}
      {!loading && !error && (
        <div className="results-info">
          <p>
            {searchQuery ? (
              <>
                Found {pagination.totalItems} user{pagination.totalItems !== 1 ? 's' : ''} 
                matching "{searchQuery}"
              </>
            ) : (
              <>
                Showing {pagination.totalItems} user{pagination.totalItems !== 1 ? 's' : ''}
              </>
            )}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="users-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonCard 
              key={index} 
              hasAvatar={true}
              lines={3}
              className="user-skeleton"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage 
          message={error}
          onRetry={() => fetchUsers(currentPage, searchQuery)}
        />
      )}

      {/* Users Grid */}
      {!loading && !error && (
        <>
          {users.length > 0 ? (
            <>
              <div className="users-grid">
                {users.map(user => (
                  <UserCard 
                    key={user.id || user._id} 
                    user={user}
                    onUserUpdate={(updatedUser) => {
                      setUsers(prev => prev.map(u => 
                        (u.id || u._id) === (updatedUser.id || updatedUser._id) 
                          ? updatedUser 
                          : u
                      ))
                    }}
                    onUserDelete={(deletedUserId) => {
                      setUsers(prev => prev.filter(u => 
                        (u.id || u._id) !== deletedUserId
                      ))
                      // Update pagination count
                      setPagination(prev => ({
                        ...prev,
                        totalItems: prev.totalItems - 1
                      }))
                    }}
                  />
                ))}
              </div>
              
              {renderPagination()}
            </>
          ) : (
            <div className="no-users">
              <div className="no-users-content">
                <h3>
                  {searchQuery ? 'No users found' : 'No users yet'}
                </h3>
                <p>
                  {searchQuery 
                    ? `No users match your search for "${searchQuery}". Try a different search term.`
                    : 'There are no registered users yet.'
                  }
                </p>
                {searchQuery && (
                  <button onClick={clearSearch} className="btn btn-primary">
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default UserList