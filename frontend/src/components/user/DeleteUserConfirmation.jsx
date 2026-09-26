import React, { useState } from 'react'
import { useAuth, usePermissions } from '../../hooks/useAuth'
import userService from '../../services/userService'
import LoadingSpinner from '../common/LoadingSpinner'
import ErrorMessage from '../common/ErrorMessage'

const DeleteUserConfirmation = ({ user, onConfirm, onCancel, onSuccess }) => {
  const { user: currentUser } = useAuth()
  const { canManageUsers } = usePermissions()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isOwnAccount = (currentUser?.id || currentUser?._id) === (user?.id || user?._id)
  const canDelete = canManageUsers() || isOwnAccount
  const requiredText = `DELETE ${user?.firstName} ${user?.lastName}`

  const handleDelete = async () => {
    if (!canDelete) {
      setError('You do not have permission to delete this user')
      return
    }

    if (confirmText !== requiredText) {
      setError(`Please type "${requiredText}" to confirm`)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const userId = user?.id || user?._id
      await userService.deleteUser(userId)
      
      if (onSuccess) {
        onSuccess(userId)
      }
      
      if (onConfirm) {
        onConfirm(userId)
      }
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isConfirmValid = confirmText === requiredText

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-confirmation">
        <div className="delete-header">
          <div className="delete-icon"> </div>
          <h3>Delete User Account</h3>
        </div>

        {error && (
          <ErrorMessage 
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <div className="delete-warning">
          <p>
            You are about to permanently delete the account for{' '}
            <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}).
          </p>
          
          <div className="warning-list">
            <h4>This action will:</h4>
            <ul>
              <li>Permanently delete the user account</li>
              <li>Remove all associated tasks and data</li>
              <li>Delete all user statistics and history</li>
              <li>Remove any uploaded files or avatars</li>
              {isOwnAccount && <li><strong>Log you out of your account</strong></li>}
            </ul>
          </div>

          <div className="danger-notice">
            <strong>  This action cannot be undone!</strong>
          </div>
        </div>

        <div className="confirmation-input">
          <label htmlFor="confirmText">
            Type <code>{requiredText}</code> to confirm:
          </label>
          <input
            type="text"
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredText}
            className={confirmText && !isConfirmValid ? 'error' : ''}
            disabled={loading}
            autoComplete="off"
          />
          {confirmText && !isConfirmValid && (
            <span className="error-text">
              Text does not match. Please type exactly: {requiredText}
            </span>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={loading || !isConfirmValid}
          >
            {loading ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>🗑️ Delete User</>
            )}
          </button>
        </div>

        {isOwnAccount && (
          <div className="self-delete-notice">
            <p>
              <strong>Note:</strong> You are deleting your own account. 
              You will be logged out immediately after deletion.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeleteUserConfirmation