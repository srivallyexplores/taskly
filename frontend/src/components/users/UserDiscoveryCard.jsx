import React from 'react';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';

const UserDiscoveryCard = ({ user, onInvite, invitationStatus, loading }) => {
  const getStatusButton = () => {
    switch (invitationStatus) {
      case 'member':
        return (
          <button
            disabled
            className="w-full flex items-center justify-center px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 rounded-lg cursor-not-allowed"
          >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            Already Member
          </button>
        );
      
      case 'pending':
        return (
          <button
            disabled
            className="w-full flex items-center justify-center px-4 py-2 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 rounded-lg cursor-not-allowed"
          >
            <ClockIcon className="w-4 h-4 mr-2" />
            Invitation Pending
          </button>
        );
      
      case 'invited':
        return (
          <button
            disabled
            className="w-full flex items-center justify-center px-4 py-2 bg-info-100 dark:bg-info-900/20 text-info-700 dark:text-info-400 rounded-lg cursor-not-allowed"
          >
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Recently Invited
          </button>
        );
      
      case 'available':
      default:
        return (
          <button
            onClick={() => onInvite(user)}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            {loading ? 'Inviting...' : 'Invite to Team'}
          </button>
        );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 hover:shadow-lg transition-shadow"
    >
      {/* User Info */}
      <div className="flex flex-col items-center text-center mb-4">
        <Avatar
          src={user.avatar}
          name={user.fullname}
          size="lg"
          className="mb-3"
        />
        
        <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 text-lg mb-1">
          {user.fullname}
        </h3>
        
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-1">
          @{user.username}
        </p>
        
        <p className="text-xs text-secondary-500 dark:text-secondary-400 truncate w-full">
          {user.email}
        </p>
        
        {user.bio && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-3 line-clamp-2">
            {user.bio}
          </p>
        )}
        
        {/* Online Status */}
        {user.isOnline && (
          <div className="flex items-center mt-2 text-xs text-success-600 dark:text-success-400">
            <span className="w-2 h-2 bg-success-500 rounded-full mr-1"></span>
            Online
          </div>
        )}
      </div>
      
      {/* Action Button */}
      <div className="mt-4">
        {getStatusButton()}
      </div>
    </motion.div>
  );
};

export default UserDiscoveryCard;
