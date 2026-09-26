import React from 'react';
import { motion } from 'framer-motion';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import InvitationList from '../components/invitations/InvitationList';

const Invitations = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
          <EnvelopeIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Team Invitations
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Manage your pending team invitations
          </p>
        </div>
      </motion.div>

      {/* Invitation List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <InvitationList />
      </motion.div>
    </div>
  );
};

export default Invitations;
