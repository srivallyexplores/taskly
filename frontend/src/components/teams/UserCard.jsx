import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import Avatar from '../common/Avatar';

const UserCard = ({ user, isSelected = false, isAlreadyMember = false, onSelect, onInvite }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 p-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar
          src={user.avatar}
          name={user.fullname}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 truncate">
            {user.fullname}
          </h3>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate mt-1">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="ml-4 flex items-center space-x-2">
        {isAlreadyMember ? (
          <div className="flex items-center space-x-1 px-3 py-1 bg-secondary-100 dark:bg-secondary-700 rounded-full">
            <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
              Member
            </span>
          </div>
        ) : (
          <button
            onClick={() => onInvite?.(user)}
            className="flex items-center space-x-1 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Invite</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default UserCard;
