import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import UserDiscoveryCard from '../components/users/UserDiscoveryCard';
import TeamSelectionModal from '../components/teams/TeamSelectionModal';
import api from '../services/api';
import { LoadingSpinner } from '../components/ui/LoadingStates';

const FindUsers = () => {
  const { user } = useAuth();
  const { teams } = useTeam();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [invitationStatuses, setInvitationStatuses] = useState({});
  
  // Team selection modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Initial load - fetch all users
  useEffect(() => {
    fetchUsers(1, '');
  }, []);
  
  // Debounce search
  useEffect(() => {
    if (searchQuery === '') {
      // If search is cleared, fetch immediately
      setCurrentPage(1);
      fetchUsers(1, '');
      return;
    }
    
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on new search
      fetchUsers(1, searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch users when page or team changes
  useEffect(() => {
    if (currentPage > 1 || selectedTeam) {
      fetchUsers(currentPage, searchQuery);
    }
  }, [currentPage, selectedTeam]);
  
  const fetchUsers = async (page, query) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: 20,
        q: query || undefined,
        teamId: selectedTeam?._id || undefined
      };
      
      const response = await api.get('/users/discover', { params });
      
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        
        // Build invitation statuses map
        const statuses = {};
        response.data.users.forEach(u => {
          if (u.invitationStatus) {
            statuses[u._id] = u.invitationStatus;
          }
        });
        setInvitationStatuses(statuses);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInvite = (user) => {
    setSelectedUser(user);
    
    // If only one team, use it directly
    if (teams.length === 1) {
      setSelectedTeam(teams[0]);
      setIsTeamModalOpen(true);
    } else if (teams.length > 1) {
      // Multiple teams - show selection modal
      setIsTeamModalOpen(true);
    } else {
      setError('You need to create a team first before inviting users');
    }
  };
  
  const handleSendInvitation = async (teamId, role, message) => {
    try {
      const response = await api.post(`/teams/${teamId}/invitations`, {
        userId: selectedUser._id,
        role,
        message
      });
      
      if (response.success) {
        // Update invitation status
        setInvitationStatuses(prev => ({
          ...prev,
          [selectedUser._id]: 'pending'
        }));
        
        // Close modal
        setIsTeamModalOpen(false);
        setSelectedUser(null);
        
        // Refresh users list to update the UI
        fetchUsers(currentPage, searchQuery);
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      
      // Extract error message
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to send invitation';
      
      // If user is already a member, update the status and close modal
      if (err.response?.data?.error?.code === 'CONFLICT') {
        setInvitationStatuses(prev => ({
          ...prev,
          [selectedUser._id]: 'member'
        }));
        
        // Close modal
        setIsTeamModalOpen(false);
        setSelectedUser(null);
        
        // Show error message
        setError(errorMessage);
        
        // Refresh users list to update the UI
        fetchUsers(currentPage, searchQuery);
        
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      } else {
        // For other errors, re-throw to be handled by the modal
        throw new Error(errorMessage);
      }
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg border ${
              page === currentPage
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800'
            }`}
          >
            {page}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800"
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center">
          <UserGroupIcon className="w-8 h-8 mr-3" />
          Find Users
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
          Discover and invite users to your teams
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-3 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100"
          />
        </div>
        
        {/* Team Filter */}
        {teams.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Filter by team context
            </label>
            <select
              value={selectedTeam?._id || ''}
              onChange={(e) => {
                const team = teams.find(t => t._id === e.target.value);
                setSelectedTeam(team || null);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-100"
            >
              <option value="">All users</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
              {selectedTeam 
                ? `Showing users not in "${selectedTeam.name}"`
                : 'Showing all users'}
            </p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}
      
      {/* Users Grid */}
      {!loading && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {users.map(user => (
            <UserDiscoveryCard
              key={user._id}
              user={user}
              onInvite={handleInvite}
              invitationStatus={invitationStatuses[user._id] || 'available'}
              loading={false}
            />
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && users.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-secondary-300 dark:text-secondary-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
            No users found
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            {searchQuery 
              ? 'Try adjusting your search query'
              : 'No users available to invite'}
          </p>
        </div>
      )}
      
      {/* Pagination */}
      {!loading && renderPagination()}
      
      {/* Team Selection Modal */}
      <TeamSelectionModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        teams={teams}
        onSendInvitation={handleSendInvitation}
      />
    </div>
  );
};

export default FindUsers;
