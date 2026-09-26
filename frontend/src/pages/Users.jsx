import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import userService from '../services/userService'
import authService from '../services/authService'
import { SkeletonCard } from '../components/common/SkeletonLoader'
import ErrorMessage from '../components/common/ErrorMessage'
import DocumentHead from '../components/common/DocumentHead'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Add User form state
  const [showAddUser, setShowAddUser] = useState(false)
  const [addForm, setAddForm] = useState({ fullname: '', username: '', email: '', password: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addSuccess, setAddSuccess] = useState('')

  const usersPerPage = 12

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)

      // GET /api/users returns { success, data: { users, pagination }, message }
      const response = await userService.getAllUsers({ page, limit: usersPerPage })

      setUsers(response.data.users || response.data || [])
      setPagination(response.data.pagination || {
        totalPages: Math.ceil((response.data.length || 0) / usersPerPage),
        totalItems: response.data.length || 0,
        hasNextPage: false,
        hasPreviousPage: false
      })
    } catch (err) {
      setError(err.message)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage])

  const handleAddFormChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value })
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError(null)
    setAddSuccess('')
    try {
      // Admin-create via POST /api/auth/register. adminCreateUser does NOT
      // touch localStorage, and the backend skips auto-login for authenticated
      // callers, so the admin stays logged in as themselves.
      await authService.adminCreateUser({
        fullname: addForm.fullname,
        username: addForm.username,
        email: addForm.email,
        password: addForm.password
      })
      setAddSuccess('User added successfully!')
      setAddForm({ fullname: '', username: '', email: '', password: '' })
      setShowAddUser(false)
      // Refresh the list so the new user (and their onboarding) appears
      await fetchUsers(1)
      setCurrentPage(1)
    } catch (err) {
      setAddError(err.message || 'Failed to add user')
    } finally {
      setAddLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString()
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const getAvatarUrl = (avatar) => {
    if (!avatar) return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/img/placeholder-user.png`
    if (avatar.startsWith('http')) return avatar
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${avatar}`
  }

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    const pages = []

    // Previous Button
    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="page-link text-center"
          aria-label="Previous"
          disabled={currentPage === 1}
        >
          &laquo;
        </button>
      </li>
    )

    // Page Numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button
            onClick={() => handlePageChange(i)}
            className="page-link text-center"
          >
            {i}
          </button>
        </li>
      )
    }

    // Next Button
    pages.push(
      <li key="next" className={`page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`}>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="page-link text-center"
          aria-label="Next"
          disabled={currentPage === pagination.totalPages}
        >
          &raquo;
        </button>
      </li>
    )

    return (
      <nav aria-label="User Pagination" className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          {pages}
        </ul>
      </nav>
    )
  }

  return (
    <>
      <DocumentHead 
        title="All Users - Taskly"
        description="Browse our users and check out their completed tasks and profiles!"
        keywords="users, profiles, task management, community"
      />
      
      <div className="container py-5">
        <h2 className="text-center mb-4 fw-bold text-secondary">Explore All Users</h2>
        <p className="text-center text-muted mb-4 fs-5">Browse our users and check out their completed tasks and profiles!</p>

        {/* Add User */}
        <div className="d-flex justify-content-end mb-3">
          <button
            type="button"
            className="btn btn-primary rounded-pill px-4"
            onClick={() => { setShowAddUser((v) => !v); setAddError(null); setAddSuccess('') }}
          >
            {showAddUser ? 'Cancel' : 'Add User'}
          </button>
        </div>

        {addSuccess && (
          <div className="alert alert-success" role="alert">{addSuccess}</div>
        )}

        {showAddUser && (
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">Add New User</h5>
              {addError && (
                <div className="alert alert-danger" role="alert">{addError}</div>
              )}
              <form onSubmit={handleAddUser}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="fullname"
                      className="form-control"
                      value={addForm.fullname}
                      onChange={handleAddFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={addForm.username}
                      onChange={handleAddFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={addForm.email}
                      onChange={handleAddFormChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={addForm.password}
                      onChange={handleAddFormChange}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button type="submit" className="btn btn-success rounded-pill px-4" disabled={addLoading}>
                    {addLoading ? 'Adding...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Previous Onboards */}
        {!loading && !error && users && users.length > 0 && (
          <div className="card shadow-sm border-0 rounded-4 mb-5">
            <div className="card-body">
              <h5 className="card-title mb-3">Previous Onboards</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Onboarded</th>
                      <th scope="col">Current Step</th>
                      <th scope="col">Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={`onboard-${u._id || u.id}`}>
                        <td>{u.fullname || u.username || 'User'}</td>
                        <td>{u.email || '—'}</td>
                        <td>
                          <span className={`badge ${u.onboarding?.completed ? 'bg-success' : 'bg-secondary'}`}>
                            {u.onboarding?.completed ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>{typeof u.onboarding?.currentStep === 'number' ? u.onboarding.currentStep : '—'}</td>
                        <td>{formatDate(u.onboarding?.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="row g-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="col-lg-3 col-md-6 text-center">
                <SkeletonCard 
                  hasAvatar={true}
                  lines={3}
                  className="user-skeleton h-100"
                />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorMessage 
            message={error}
            onRetry={() => fetchUsers(currentPage)}
          />
        )}

        {/* Users Grid */}
        {!loading && !error && (
          <>
            <div className="row g-4">
              {users && users.length > 0 ? (
                users.map(user => (
                  <div key={user._id || user.id} className="col-lg-3 col-md-6 text-center">
                    <div className="user-card card shadow-lg border-0 rounded-4 h-100">
                      <div className="card-body">
                        {/* Avatar */}
                        <img 
                          src={getAvatarUrl(user.avatar)}
                          alt={`${user.username || user.fullname || 'User'}'s Avatar`}
                          className="user-card-img rounded-circle shadow mb-3"
                          loading="lazy"
                          style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                        />

                        {/* Username */}
                        <h3 className="text-center fw-bold mb-2">
                          {user.username || user.fullname || 'User Name'}
                        </h3>

                        {/* Tasks Completed */}
                        <h5 className="text-center text-success fw-bold">
                          Tasks Completed: {user.stats?.completed || 0}
                        </h5>

                        {/* View Profile Button */}
                        <Link 
                          to={`/users/${user._id || user.id}`}
                          className="btn btn-view-profile btn-primary mt-3 rounded-pill px-4"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback when No Users */
                <div className="col-12">
                  <p className="text-center text-muted fs-5">No users found. Be the first to join our platform!</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </>
  )
}

export default Users