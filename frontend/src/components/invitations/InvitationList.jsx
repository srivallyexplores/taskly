import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import InvitationCard from './InvitationCard';
import api from '../../services/api';

const InvitationList = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchInvitations();
  }, [page]);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/invitations/user', {
        params: {
          status: 'pending',
          page,
          limit: 10
        }
      });

      //console.log('  [InvitationList] Response:', response.data);
      
      // Handle different response formats
      let invitationsData = [];
      let paginationData = { pages: 1 };
      
      if (response.data.success) {
        // Wrapped in success
        invitationsData = response.data.data?.invitations || response.data.data || [];
        paginationData = response.data.data?.pagination || { pages: 1 };
      } else if (response.data.invitations) {
        // Direct response with invitations property
        invitationsData = response.data.invitations;
        paginationData = response.data.pagination || { pages: 1 };
      } else if (Array.isArray(response.data)) {
        // Direct array
        invitationsData = response.data;
      }
      
      //console.log('  [InvitationList] Extracted invitations:', invitationsData);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : []);
      setTotalPages(paginationData.pages || 1);
    } catch (err) {
      //console.error('Error fetching invitations:', err);
      // Don't show error if it's just empty - show empty state instead
      if (err.response?.status === 404) {
        setInvitations([]);
        setTotalPages(0);
      } else {
        setError('Failed to load invitations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/accept`);
      if (response.data.success) {
        // Remove invitation from list
        setInvitations(invitations.filter(inv => inv._id !== invitationId));
        toast.success('Invitation accepted! You have joined the team.');
      }
    } catch (err) {
      //console.error('Error accepting invitation:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to accept invitation';
      
      // If invitation was already accepted or is no longer pending, refresh the list
      if (err.response?.status === 400 || err.response?.status === 409) {
        toast.error(errorMessage);
        // Refresh invitations to get current state
        fetchInvitations();
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeny = async (invitationId) => {
    try {
      const response = await api.post(`/invitations/${invitationId}/deny`);
      if (response.data.success) {
        // Remove invitation from list
        setInvitations(invitations.filter(inv => inv._id !== invitationId));
        toast.success('Invitation denied');
      }
    } catch (err) {
      //console.error('Error denying invitation:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to deny invitation';
      
      // If invitation was already processed or is no longer pending, refresh the list
      if (err.response?.status === 400 || err.response?.status === 409) {
        toast.error(errorMessage);
        // Refresh invitations to get current state
        fetchInvitations();
      } else {
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.length > 0 ? (
        <>
          <AnimatePresence>
            {invitations.map((invitation, index) => (
              <motion.div
                key={invitation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <InvitationCard
                  invitation={invitation}
                  onAccept={() => handleAccept(invitation._id)}
                  onDeny={() => handleDeny(invitation._id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-secondary-600 dark:text-secondary-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-secondary-200 dark:border-secondary-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <CheckCircleIcon className="w-12 h-12 text-secondary-300 dark:text-secondary-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-1">
            No pending invitations
          </h3>
          <p className="text-secondary-600 dark:text-secondary-400">
            You're all caught up! Check back later for new team invitations.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvitationList;
