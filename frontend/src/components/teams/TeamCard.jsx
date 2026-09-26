import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  FolderIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  LockClosedIcon,
  GlobeAltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import DropdownMenu from '../common/DropdownMenu';
import ConfirmDialog from '../common/ConfirmDialog';
import InvitationModal from './InvitationModal';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

const TeamCard = ({ team, viewMode = 'grid', onClick, className = '' }) => {
  const navigate = useNavigate();
  const { getUserRoleInTeam, canPerformAction, leaveTeam } = useTeam();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const userRole = getUserRoleInTeam(team._id);
  const memberCount = team.members?.length || 0;
  const projectCount = team.projects?.length || 0;

  // Calculate team activity score (placeholder)
  const activityScore = Math.floor(Math.random() * 100);

  // Get recent members (last 3)
  const recentMembers = team.members?.slice(0, 3) || [];

  // Handle leave team
  const handleLeaveTeam = async () => {
    try {
      const result = await leaveTeam(team._id);
      if (result.success) {
        toast.success('You have left the team');
        setShowLeaveConfirm(false);
      } else {
        toast.error(result.error || 'Failed to leave team');
      }
    } catch (error) {
      toast.error('Failed to leave team');
    }
  };

  // Menu options based on user permissions
  const menuOptions = [
    {
      label: 'View Dashboard',
      icon: ChartBarIcon,
      onClick: () => navigate(`/teams/${team._id}`),
      show: true
    },
    {
      label: 'Team Settings',
      icon: Cog6ToothIcon,
      onClick: () => navigate(`/teams/${team._id}/settings`),
      show: canPerformAction(team._id, 'manage_settings')
    },
    {
      label: 'Invite Members',
      icon: UserGroupIcon,
      onClick: () => setShowInviteModal(true),
      show: canPerformAction(team._id, 'invite_members')
    },
    {
      label: 'Leave Team',
      icon: ArrowRightIcon,
      onClick: () => setShowLeaveConfirm(true),
      show: userRole && userRole !== 'owner',
      className: 'text-red-600 dark:text-red-400'
    }
  ].filter(option => option.show);

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on menu or other interactive elements
    if (e.target.closest('[data-no-click]')) {
      return;
    }
    onClick?.(team);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Team Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {team.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Team Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 truncate">
                  {team.name}
                </h3>
                <Badge
                  variant={team.isPrivate ? 'warning' : 'success'}
                  size="sm"
                >
                  {team.isPrivate ? (
                    <>
                      <LockClosedIcon className="w-3 h-3 mr-1" />
                      Private
                    </>
                  ) : (
                    <>
                      <GlobeAltIcon className="w-3 h-3 mr-1" />
                      Public
                    </>
                  )}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {userRole}
                </Badge>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mt-1 truncate">
                {team.description || 'No description'}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm text-secondary-600 dark:text-secondary-400">
              <div className="flex items-center space-x-1">
                <UsersIcon className="w-4 h-4" />
                <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FolderIcon className="w-4 h-4" />
                <span>{projectCount} project{projectCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(team.createdAt))} ago</span>
              </div>
            </div>

            {/* Recent Members */}
            <div className="hidden lg:flex items-center space-x-1">
              {recentMembers.map((member, index) => (
                <Avatar
                  key={member.user._id}
                  src={member.user.avatar}
                  name={member.user.name}
                  size="sm"
                  className={index > 0 ? '-ml-2' : ''}
                />
              ))}
              {memberCount > 3 && (
                <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-600 rounded-full flex items-center justify-center text-xs font-medium text-secondary-600 dark:text-secondary-400 -ml-2">
                  +{memberCount - 3}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2" data-no-click>
            <DropdownMenu
              trigger={
                <button className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
              }
              items={menuOptions}
              align="right"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {team.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {team.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                variant={team.isPrivate ? 'warning' : 'success'}
                size="sm"
              >
                {team.isPrivate ? (
                  <>
                    <LockClosedIcon className="w-3 h-3 mr-1" />
                    Private
                  </>
                ) : (
                  <>
                    <GlobeAltIcon className="w-3 h-3 mr-1" />
                    Public
                  </>
                )}
              </Badge>
              <Badge variant="secondary" size="sm">
                {userRole}
              </Badge>
            </div>
          </div>
        </div>

        <div data-no-click>
          <DropdownMenu
            trigger={
              <button className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
            }
            items={menuOptions}
            align="right"
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4 line-clamp-2">
        {team.description || 'No description provided for this team.'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <UsersIcon className="w-4 h-4 text-secondary-500" />
          <span className="text-sm text-secondary-600 dark:text-secondary-400">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <FolderIcon className="w-4 h-4 text-secondary-500" />
          <span className="text-sm text-secondary-600 dark:text-secondary-400">
            {projectCount} project{projectCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Activity Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-secondary-600 dark:text-secondary-400">Activity</span>
          <span className="text-secondary-900 dark:text-secondary-100 font-medium">
            {activityScore}%
          </span>
        </div>
        <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              activityScore >= 70
                ? 'bg-green-500'
                : activityScore >= 40
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${activityScore}%` }}
          />
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {recentMembers.map((member, index) => (
            <Avatar
              key={member.user._id}
              src={member.user.avatar}
              name={member.user.name}
              size="sm"
              className={index > 0 ? '-ml-2' : ''}
            />
          ))}
          {memberCount > 3 && (
            <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-600 rounded-full flex items-center justify-center text-xs font-medium text-secondary-600 dark:text-secondary-400 -ml-2">
              +{memberCount - 3}
            </div>
          )}
        </div>

        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {formatDistanceToNow(new Date(team.createdAt))} ago
        </span>
      </div>

      {/* Leave Team Confirmation - Rendered via Portal */}
      {showLeaveConfirm && (
        <ConfirmDialog
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleLeaveTeam}
          title="Leave Team"
          message={`Are you sure you want to leave "${team.name}"? You will lose access to all team projects and tasks.`}
          confirmText="Leave Team"
          confirmVariant="danger"
        />
      )}

      {/* Invite Members Modal - Rendered via Portal */}
      {showInviteModal && (
        <InvitationModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={team._id}
          teamName={team.name}
        />
      )}
    </motion.div>
  );
};

export default TeamCard;