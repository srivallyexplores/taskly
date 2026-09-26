import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  EllipsisVerticalIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Dropdown from '../common/Dropdown';
import { format, formatDistanceToNow } from 'date-fns';

const MemberCard = ({ 
  member, 
  viewMode = 'grid', 
  onClick, 
  teamId, 
  projectId,
  showActions = true 
}) => {
  const { user: currentUser } = useAuth();
  const { 
    updateMemberRole: updateTeamMemberRole, 
    removeMember: removeTeamMember,
    canPerformAction: canPerformTeamAction 
  } = useTeam();
  const { 
    updateProjectMemberRole, 
    removeProjectMember,
    canPerformAction: canPerformProjectAction 
  } = useProject();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (projectId) {
        await updateProjectMemberRole(projectId, member.user._id, newRole);
      } else if (teamId) {
        await updateTeamMemberRole(teamId, member.user._id, newRole);
      }
    } catch (error) {
      //console.error('Failed to update member role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (projectId) {
        await removeProjectMember(projectId, member.user._id);
      } else if (teamId) {
        await removeTeamMember(teamId, member.user._id);
      }
    } catch (error) {
      //console.error('Failed to remove member:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const canManageMembers = projectId 
    ? canPerformProjectAction(projectId, 'manage_members')
    : canPerformTeamAction(teamId, 'manage_members');

  const canRemoveMember = canManageMembers && member.user._id !== currentUser._id;
  const canChangeRole = canManageMembers && member.user._id !== currentUser._id;

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusIndicator = () => {
    const isOnline = member.user.lastActive && 
      new Date() - new Date(member.user.lastActive) < 5 * 60 * 1000; // 5 minutes

    return (
      <div className={`w-3 h-3 rounded-full ${
        isOnline 
          ? 'bg-green-500' 
          : 'bg-gray-300 dark:bg-gray-600'
      }`} />
    );
  };

  const actionItems = [
    ...(canChangeRole ? [
      {
        label: 'Change Role',
        icon: CogIcon,
        submenu: [
          {
            label: 'Owner',
            onClick: () => handleRoleChange('owner'),
            disabled: member.role === 'owner'
          },
          {
            label: 'Admin',
            onClick: () => handleRoleChange('admin'),
            disabled: member.role === 'admin'
          },
          {
            label: 'Member',
            onClick: () => handleRoleChange('member'),
            disabled: member.role === 'member'
          }
        ]
      }
    ] : []),
    {
      label: 'Send Email',
      icon: EnvelopeIcon,
      onClick: () => window.open(`mailto:${member.user.email}`)
    },
    ...(canRemoveMember ? [
      {
        label: 'Remove Member',
        icon: TrashIcon,
        onClick: handleRemoveMember,
        className: 'text-red-600 dark:text-red-400',
        disabled: isUpdating
      }
    ] : [])
  ];

  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar
                src={member.user.avatar}
                name={member.user.name}
                size="md"
              />
              <div className="absolute -bottom-1 -right-1">
                {getStatusIndicator()}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                  {member.user.name}
                </h3>
                <Badge className={getRoleColor(member.role)} size="sm">
                  {member.role}
                </Badge>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                {member.user.email}
              </p>
              <p className="text-xs text-secondary-500 dark:text-secondary-500">
                Joined {formatDistanceToNow(new Date(member.joinedAt || member.createdAt))} ago
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {member.user.lastActive && (
              <div className="text-xs text-secondary-500 dark:text-secondary-500">
                Active {formatDistanceToNow(new Date(member.user.lastActive))} ago
              </div>
            )}
            
            {showActions && actionItems.length > 0 && (
              <Dropdown
                trigger={
                  <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300">
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                }
                items={actionItems}
                align="right"
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          <Avatar
            src={member.user.avatar}
            name={member.user.name}
            size="lg"
          />
          <div className="absolute -bottom-1 -right-1">
            {getStatusIndicator()}
          </div>
        </div>
        
        {showActions && actionItems.length > 0 && (
          <Dropdown
            trigger={
              <button className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            }
            items={actionItems}
            align="right"
          />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100 truncate">
            {member.user.name}
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
            {member.user.email}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Badge className={getRoleColor(member.role)} size="sm">
            {member.role}
          </Badge>
          
          {member.user.lastActive && (
            <div className="text-xs text-secondary-500 dark:text-secondary-500">
              Active {formatDistanceToNow(new Date(member.user.lastActive))} ago
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center text-xs text-secondary-500 dark:text-secondary-500">
            <CalendarIcon className="w-3 h-3 mr-1" />
            Joined {format(new Date(member.joinedAt || member.createdAt), 'MMM d, yyyy')}
          </div>
        </div>

        {/* Additional member stats for projects */}
        {projectId && member.stats && (
          <div className="pt-2 border-t border-secondary-200 dark:border-secondary-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium text-secondary-900 dark:text-secondary-100">
                  {member.stats.tasksAssigned || 0}
                </div>
                <div className="text-secondary-500 dark:text-secondary-500">Tasks</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-secondary-900 dark:text-secondary-100">
                  {member.stats.tasksCompleted || 0}
                </div>
                <div className="text-secondary-500 dark:text-secondary-500">Completed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MemberCard;