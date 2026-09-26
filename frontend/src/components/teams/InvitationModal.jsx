import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import api from '../../services/api';

// This modal supports two modes:
// 1. Direct user invitation (when user prop is provided)
// 2. User search mode (when teamId is provided without user)
const InvitationModal = ({ isOpen, onClose, user, team, teamId, teamName }) => {
  const [role, setRole] = useState('member');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Search mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Determine which team ID to use
  const effectiveTeamId = team?._id || teamId;
  const effectiveTeamName = team?.name || teamName;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setSuccess(false);
      setError(null);
      setRole('member');
      setMessage('');
    }
  }, [isOpen]);

  // Search for users
  const handleSearch = async (query) => {
    //console.log('  [InvitationModal] Search initiated:', { query, effectiveTeamId });
    setSearchQuery(query);
    if (query.length < 2) {
      //console.log('  [InvitationModal] Query too short, clearing results');
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      //console.log('  [InvitationModal] Making API call to:', `/teams/${effectiveTeamId}/search-users`);
      const response = await api.get(`/teams/${effectiveTeamId}/search-users`, {
        params: { q: query }
      });
      //console.log('  [InvitationModal] API Response:', response.data);
      
      if (response.data.success) {
        const users = response.data.data?.users || response.data.data || [];
        //console.log('  [InvitationModal] Extracted users:', users);
        //console.log('  [InvitationModal] Users is array?', Array.isArray(users));
        //console.log('  [InvitationModal] Users length:', users.length);
        setSearchResults(users);
        //console.log('  [InvitationModal] Search results state updated');
      } else {
        //console.log('  [InvitationModal] Response not successful:', response.data);
      }
    } catch (err) {
      //console.error('❌ [InvitationModal] Error searching users:', err);
      //console.error('❌ [InvitationModal] Error response:', err.response?.data);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSendInvitation = async () => {
    const targetUser = user || selectedUser;
    if (!targetUser) {
      setError('Please select a user to invite');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/teams/${effectiveTeamId}/invitations`, {
        userId: targetUser._id,
        role,
        message: message || undefined
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setRole('member');
          setMessage('');
          setSelectedUser(null);
          setSearchQuery('');
        }, 2000);
      }
    } catch (err) {
      //console.error('Error sending invitation:', err);
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const targetUser = user || selectedUser;
  const isSearchMode = !user;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        e.stopPropagation();
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100">
            Invite to {effectiveTeamName || 'Team'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex justify-center mb-4"
              >
                <CheckCircleIcon className="w-16 h-16 text-green-500" />
              </motion.div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
                Invitation Sent!
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400">
                {targetUser?.fullname} will receive an invitation to join {effectiveTeamName}
              </p>
            </div>
          ) : (
            <>
              {/* Search Mode - User Search */}
              {isSearchMode && !selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                    Search Users
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search by name or username..."
                      className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searching && (
                    <div className="mt-4 text-center text-secondary-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto mb-2"></div>
                      Searching...
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="mt-4 max-h-64 overflow-y-auto space-y-2 border border-secondary-200 dark:border-secondary-700 rounded-lg p-2">
                      {searchResults.map((searchUser) => (
                        <button
                          key={searchUser._id}
                          onClick={() => setSelectedUser(searchUser)}
                          className="w-full flex items-center space-x-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-left border border-transparent hover:border-primary-300 dark:hover:border-primary-600"
                        >
                          <Avatar src={searchUser.avatar} name={searchUser.fullname} size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary-900 dark:text-secondary-100 truncate text-base">
                              {searchUser.fullname}
                            </p>
                            <p className="text-sm text-secondary-500 dark:text-secondary-400">
                              @{searchUser.username}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="mt-2 text-center text-secondary-500 dark:text-secondary-400">
                      No users found
                    </div>
                  )}
                </div>
              )}

              {/* User Preview (when user is selected or provided) */}
              {targetUser && (
                <div className="flex items-center space-x-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-lg">
                  <Avatar
                    src={targetUser.avatar}
                    name={targetUser.fullname}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                      {targetUser.fullname}
                    </h3>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      @{targetUser.username}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                      {targetUser.email}
                    </p>
                  </div>
                  {isSearchMode && (
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-secondary-100"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  {role === 'admin'
                    ? 'Admins can manage team members and projects'
                    : 'Members can participate in projects and tasks'}
                </p>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                  placeholder="Add a personal message to the invitation..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-secondary-100 resize-none"
                />
                <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
                  {message.length}/500 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 dark:border-secondary-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvitation}
              disabled={loading || !targetUser}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Invitation</span>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  // Use portal to render at document body level to avoid z-index issues
  return createPortal(modalContent, document.body);
};

export default InvitationModal;
