import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';
import { formatDistanceToNow } from 'date-fns';

const InvitationCard = ({ invitation, onAccept, onDeny }) => {
  const [accepting, setAccepting] = useState(false);
  const [denying, setDenying] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  };

  const handleDeny = async () => {
    setDenying(true);
    try {
      await onDeny();
    } finally {
      setDenying(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Team Info */}
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">
              {invitation.team.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {invitation.team.name}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
              {invitation.team.description || 'No description'}
            </p>
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-secondary-500 dark:text-secondary-400 ml-4 flex-shrink-0">
          {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Inviter Info */}
      <div className="mb-4 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg flex items-center space-x-3">
        <Avatar
          src={invitation.inviter.avatar}
          name={invitation.inviter.fullname}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            Invited by {invitation.inviter.fullname}
          </p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            @{invitation.inviter.username}
          </p>
        </div>
      </div>

      {/* Message */}
      {invitation.message && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            "{invitation.message}"
          </p>
        </div>
      )}

      {/* Role */}
      <div className="mb-4">
        <p className="text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wide">
          Proposed Role
        </p>
        <p className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 capitalize">
          {invitation.role}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleAccept}
          disabled={accepting || denying}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {accepting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Accepting...</span>
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>Accept</span>
            </>
          )}
        </button>
        <button
          onClick={handleDeny}
          disabled={accepting || denying}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {denying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Denying...</span>
            </>
          ) : (
            <>
              <XMarkIcon className="w-4 h-4" />
              <span>Deny</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default InvitationCard;
