import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  UserIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import LoadingSpinner from '../common/LoadingSpinner';

const RoleManager = ({ 
  isOpen, 
  onClose, 
  member, 
  teamId, 
  projectId 
}) => {
  const { user: currentUser } = useAuth();
  const { 
    updateMemberRole: updateTeamMemberRole, 
    canPerformAction: canPerformTeamAction,
    loading: teamLoading 
  } = useTeam();
  const { 
    updateProjectMemberRole, 
    canPerformAction: canPerformProjectAction,
    loading: projectLoading 
  } = useProject();

  const [selectedRole, setSelectedRole] = useState(member?.role || 'member');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const loading = teamLoading.updateMemberRole || projectLoading.updateMemberRole;

  const canManageRoles = projectId 
    ? canPerformProjectAction(projectId, 'manage_members')
    : canPerformTeamAction(teamId, 'manage_members');

  const canChangeThisRole = canManageRoles && member?.user._id !== currentUser._id;

  const roles = projectId ? [
    {
      value: 'member',
      label: 'Member',
      description: 'Can view project details and work on assigned tasks',
      permissions: [
        'View project details',
        'View and update assigned tasks',
        'Add comments and collaborate',
        'View team members'
      ]
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage project settings and assign tasks',
      permissions: [
        'All member permissions',
        'Manage project settings',
        'Assign and manage tasks',
        'Add and remove members',
        'View project analytics'
      ]
    },
    {
      value: 'owner',
      label: 'Owner',
      description: 'Full control over the project',
      permissions: [
        'All admin permissions',
        'Delete project',
        'Transfer ownership',
        'Manage billing (if applicable)'
      ]
    }
  ] : [
    {
      value: 'member',
      label: 'Member',
      description: 'Can participate in team activities and projects',
      permissions: [
        'View team details',
        'Participate in team projects',
        'View team members',
        'Create and manage own tasks'
      ]
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Can manage team settings and members',
      permissions: [
        'All member permissions',
        'Manage team settings',
        'Add and remove members',
        'Create and manage projects',
        'View team analytics'
      ]
    },
    {
      value: 'owner',
      label: 'Owner',
      description: 'Full control over the team',
      permissions: [
        'All admin permissions',
        'Delete team',
        'Transfer ownership',
        'Manage billing and subscriptions'
      ]
    }
  ];

  const handleRoleChange = async () => {
    if (!canChangeThisRole || selectedRole === member.role) {
      return;
    }

    try {
      if (projectId) {
        await updateProjectMemberRole(projectId, member.user._id, selectedRole);
      } else if (teamId) {
        await updateTeamMemberRole(teamId, member.user._id, selectedRole);
      }
      
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      //console.error('Failed to update member role:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'member': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return ShieldCheckIcon;
      case 'admin': return CogIcon;
      case 'member': return UserIcon;
      default: return UserIcon;
    }
  };

  const isRoleChangeSignificant = (newRole) => {
    const roleHierarchy = { member: 1, admin: 2, owner: 3 };
    const currentLevel = roleHierarchy[member?.role] || 1;
    const newLevel = roleHierarchy[newRole] || 1;
    
    return Math.abs(newLevel - currentLevel) > 1 || newRole === 'owner';
  };

  const handleSubmit = () => {
    if (isRoleChangeSignificant(selectedRole)) {
      setShowConfirmation(true);
    } else {
      handleRoleChange();
    }
  };

  if (!member) return null;

  return (
    <>
      <Modal
        isOpen={isOpen && !showConfirmation}
        onClose={onClose}
        title="Manage Member Role"
        size="lg"
      >
        <div className="space-y-6">
          {/* Member Info */}
          <div className="flex items-center space-x-4 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
            <img
              src={member.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=6366f1&color=fff`}
              alt={member.user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                {member.user.name}
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {member.user.email}
              </p>
              <Badge className={getRoleColor(member.role)} size="sm">
                Current: {member.role}
              </Badge>
            </div>
          </div>

          {!canChangeThisRole && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {member.user._id === currentUser._id 
                    ? "You cannot change your own role"
                    : "You don't have permission to change this member's role"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-4">
            <h4 className="font-medium text-secondary-900 dark:text-secondary-100">
              Select New Role
            </h4>
            
            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = getRoleIcon(role.value);
                const isSelected = selectedRole === role.value;
                const isCurrent = member.role === role.value;
                
                return (
                  <motion.div
                    key={role.value}
                    whileHover={{ scale: canChangeThisRole ? 1.01 : 1 }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                    } ${!canChangeThisRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => canChangeThisRole && setSelectedRole(role.value)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-6 h-6 mt-1 ${
                        isSelected 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-secondary-600 dark:text-secondary-400'
                      }`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium text-secondary-900 dark:text-secondary-100">
                            {role.label}
                          </h5>
                          {isCurrent && (
                            <Badge variant="secondary" size="sm">
                              Current
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                          {role.description}
                        </p>
                        
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-secondary-700 dark:text-secondary-300 uppercase tracking-wide">
                            Permissions
                          </p>
                          <ul className="text-xs text-secondary-600 dark:text-secondary-400 space-y-1">
                            {role.permissions.map((permission, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                                <span>{permission}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            
            {canChangeThisRole && (
              <button
                onClick={handleSubmit}
                disabled={selectedRole === member.role || loading}
                className="btn-primary"
              >
                {loading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                )}
                Update Role
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Role Change"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-secondary-900 dark:text-secondary-100">
                Are you sure you want to change {member.user.name}'s role to {selectedRole}?
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                This will {selectedRole === 'owner' ? 'transfer ownership and ' : ''}
                {roles.find(r => r.value === selectedRole)?.description.toLowerCase()}.
              </p>
            </div>
          </div>
          
          {selectedRole === 'owner' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> Transferring ownership will give {member.user.name} full control 
                over this {projectId ? 'project' : 'team'} and reduce your role to admin.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowConfirmation(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleRoleChange}
              disabled={loading}
              className="btn-danger"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              Confirm Change
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RoleManager;