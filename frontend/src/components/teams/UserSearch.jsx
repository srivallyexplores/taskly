import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import api from '../../services/api';

const UserSearch = ({ teamId, onUserSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search users when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchUsers(debouncedQuery, 1);
    } else {
      setUsers([]);
      setError(null);
    }
  }, [debouncedQuery]);

  const searchUsers = async (searchQuery, pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/teams/${teamId}/search-users`, {
        params: {
          q: searchQuery,
          page: pageNum,
          limit: 10
        }
      });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      //console.error('Search error:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    if (nextPage <= totalPages) {
      setPage(nextPage);
      searchUsers(debouncedQuery, nextPage);
    }
  };

  const handleUserSelect = (user) => {
    onUserSelect(user);
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name, username, or email..."
          className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-secondary-100"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Results */}
      {!loading && debouncedQuery.length >= 2 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.length > 0 ? (
            <>
              <AnimatePresence>
                {users.map((user, index) => (
                  <motion.button
                    key={user._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-left"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.fullname}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                        {user.fullname}
                      </p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                    {user.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* Load More Button */}
              {page < totalPages && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                >
                  Load more results
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary-500 dark:text-secondary-400">
                No users found matching "{debouncedQuery}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && debouncedQuery.length === 0 && (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-2" />
          <p className="text-secondary-500 dark:text-secondary-400">
            Start typing to search for users
          </p>
        </div>
      )}

      {/* Query Too Short */}
      {!loading && debouncedQuery.length > 0 && debouncedQuery.length < 2 && (
        <div className="text-center py-8">
          <p className="text-secondary-500 dark:text-secondary-400">
            Enter at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
