import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  ShareIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTeam } from '../../context/TeamContext';

const MobileTeamActions = ({ 
  teamId, 
  onCreateProject, 
  onInviteMembers, 
  onTeamSettings, 
  onTeamAnalytics,
  onShareTeam 
}) => {
  const { isMobile } = useMobileDetection();
  const { canPerformAction } = useTeam();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) return null;

  const actions = [
    {
      id: 'create-project',
      label: 'New Project',
      icon: PlusIcon,
      action: onCreateProject,
      show: canPerformAction(teamId, 'create_projects'),
      color: 'bg-blue-500'
    },
    {
      id: 'invite-members',
      label: 'Invite Members',
      icon: UserPlusIcon,
      action: onInviteMembers,
      show: canPerformAction(teamId, 'invite_members'),
      color: 'bg-green-500'
    },
    {
      id: 'share-team',
      label: 'Share Team',
      icon: ShareIcon,
      action: onShareTeam,
      show: true,
      color: 'bg-purple-500'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: ChartBarIcon,
      action: onTeamAnalytics,
      show: true,
      color: 'bg-yellow-500'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      action: onTeamSettings,
      show: canPerformAction(teamId, 'manage_team_settings'),
      color: 'bg-gray-500'
    }
  ].filter(action => action.show);

  const handleActionClick = (action) => {
    setIsOpen(false);
    if (action.action) {
      action.action();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <EllipsisVerticalIcon className="w-6 h-6" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Action Items */}
            <div className="fixed bottom-36 right-4 z-50 space-y-3">
              {actions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 50, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: { delay: index * 0.1 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    x: 50, 
                    scale: 0.8,
                    transition: { delay: (actions.length - index - 1) * 0.05 }
                  }}
                  className="flex items-center space-x-3"
                >
                  <span className="bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
                    {action.label}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleActionClick(action)}
                    className={`w-12 h-12 ${action.color} text-white rounded-full shadow-lg flex items-center justify-center`}
                  >
                    <action.icon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileTeamActions;