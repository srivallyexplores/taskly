import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cog6ToothIcon,
  UsersIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import ConfirmDialog from '../common/ConfirmDialog';
import { toast } from 'react-hot-toast';

const TeamSettings = ({ teamId, isOpen, onClose }) => {
  const { user } = useAuth();
  const {
    currentTeam,
    fetchTeam,
    updateTeam,
    deleteTeam,
    archiveTeam,
    unarchiveTeam,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    regenerateInviteCode,
    sendInvitations,
    loading,
    errors,
    canPerformAction
  } = useTeam();

  const [activeTab, setActiveTab] = useState('general');
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Cog6ToothIcon },
    { id: 'members', label: 'Members', icon: UsersIcon },
    { id: 'invites', label: 'Invites', icon: KeyIcon },
    { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon }
  ];

  // Load team data when modal opens (only if not already loaded)
  useEffect(() => {
    if (isOpen && teamId && (!currentTeam || currentTeam._id !== teamId)) {
      //console.log('⚙️ [TeamSettings] Fetching team');
      fetchTeam(teamId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, teamId]);

  // Update form data when team loads
  useEffect(() => {
    if (currentTeam) {
      setTeamData({
        name: currentTeam.name || '',
        description: currentTeam.description || '',
        isPrivate: currentTeam.isPrivate || false
      });
    }
  }, [currentTeam]);

  // Handle team update
  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    
    try {
      const result = await updateTeam(teamId, teamData);
      if (result.success) {
        toast.success('Team updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update team');
    }
  };

  // Handle member role update
  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      const result = await updateTeamMemberRole(teamId, userId, newRole);
      if (result.success) {
        toast.success('Member role updated');
      }
    } catch (error) {
      toast.error('Failed to update member role');
    }
  };

  // Handle member removal
  const handleRemoveMember = async (userId) => {
    try {
      const result = await removeTeamMember(teamId, userId);
      if (result.success) {
        toast.success('Member removed from team');
        setMemberToRemove(null);
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  // Handle invite code regeneration
  const handleRegenerateInviteCode = async () => {
    try {
      const result = await regenerateInviteCode(teamId);
      if (result.success) {
        toast.success('Invite code regenerated');
      }
    } catch (error) {
      toast.error('Failed to regenerate invite code');
    }
  };

  // Handle sending invitations
  const handleSendInvitations = async (e) => {
    e.preventDefault();
    
    if (!inviteEmails.trim()) {
      toast.error('Please enter at least one email address');
      return;
    }

    const emails = inviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    try {
      const result = await sendInvitations(teamId, emails, inviteRole, inviteMessage);
      if (result.success) {
        toast.success(`Invitations sent to ${emails.length} email${emails.length !== 1 ? 's' : ''}`);
        setInviteEmails('');
        setInviteMessage('');
      }
    } catch (error) {
      toast.error('Failed to send invitations');
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    try {
      const result = await deleteTeam(teamId);
      if (result.success) {
        toast.success('Team deleted successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  // Handle team archive/unarchive
  const handleArchiveTeam = async () => {
    try {
      const result = currentTeam.archived 
        ? await unarchiveTeam(teamId)
        : await archiveTeam(teamId);
      
      if (result.success) {
        toast.success(currentTeam.archived ? 'Team unarchived successfully' : 'Team archived successfully');
        setShowArchiveConfirm(false);
        // Refresh team data
        await fetchTeam(teamId);
      }
    } catch (error) {
      toast.error(currentTeam.archived ? 'Failed to unarchive team' : 'Failed to archive team');
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = async () => {
    if (currentTeam?.inviteCode) {
      try {
        await navigator.clipboard.writeText(currentTeam.inviteCode);
        toast.success('Invite code copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy invite code');
      }
    }
  };

  if (!currentTeam) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Team Settings">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Team Settings"
        size="xl"
      >
        <div className="flex h-96">
          {/* Sidebar */}
          <div className="w-64 border-r border-secondary-200 dark:border-secondary-700 pr-6">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                      General Settings
                    </h3>
                    
                    <form onSubmit={handleUpdateTeam} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Team Name
                        </label>
                        <input
                          type="text"
                          value={teamData.name}
                          onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500"
                          required
                          disabled={!canPerformAction(teamId, 'manage_settings')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={teamData.description}
                          onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
                          rows={4}
                          className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 resize-none"
                          placeholder="Describe your team's purpose..."
                          disabled={!canPerformAction(teamId, 'manage_settings')}
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPrivate"
                          checked={teamData.isPrivate}
                          onChange={(e) => setTeamData({ ...teamData, isPrivate: e.target.checked })}
                          className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
                          disabled={!canPerformAction(teamId, 'manage_settings')}
                        />
                        <label htmlFor="isPrivate" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
                          Make this team private
                        </label>
                      </div>

                      {canPerformAction(teamId, 'manage_settings') && (
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={loading.operations}
                            className="btn-primary"
                          >
                            {loading.operations ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                      Team Members ({currentTeam.members?.length || 0})
                    </h3>
                    
                    <div className="space-y-3">
                      {currentTeam.members?.map((member) => (
                        <div
                          key={member.user._id}
                          className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={member.user.avatar}
                              name={member.user.name}
                              size="md"
                            />
                            <div>
                              <p className="font-medium text-secondary-900 dark:text-secondary-100">
                                {member.user.name}
                              </p>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                {member.user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <Badge variant={member.role === 'owner' ? 'primary' : 'secondary'}>
                              {member.role}
                            </Badge>
                            
                            {canPerformAction(teamId, 'manage_members') && member.role !== 'owner' && (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateMemberRole(member.user._id, e.target.value)}
                                  className="text-sm border border-secondary-300 dark:border-secondary-600 rounded px-2 py-1 bg-white dark:bg-secondary-700"
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                                
                                <button
                                  onClick={() => setMemberToRemove(member)}
                                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  title="Remove member"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'invites' && (
                <motion.div
                  key="invites"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Invite Code */}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                      Invite Code
                    </h3>
                    
                    <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4 space-y-4">
                      {/* Invite Code */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                            Invite Code
                          </span>
                          <button
                            onClick={() => setShowInviteCode(!showInviteCode)}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                          >
                            {showInviteCode ? (
                              <>
                                <EyeSlashIcon className="w-4 h-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <EyeIcon className="w-4 h-4 mr-1" />
                                Show
                              </>
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded font-mono text-sm">
                            {showInviteCode ? currentTeam.inviteCode : '••••••••'}
                          </code>
                          <button
                            onClick={copyInviteCode}
                            className="px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors"
                            title="Copy code"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                          {canPerformAction(teamId, 'manage_settings') && (
                            <button
                              onClick={handleRegenerateInviteCode}
                              className="px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors text-sm"
                            >
                              Regenerate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Invite URL */}
                      <div>
                        <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 block mb-2">
                          Invite Link
                        </span>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/join/${currentTeam.inviteCode}`}
                            className="flex-1 px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded text-sm text-secondary-600 dark:text-secondary-400"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/join/${currentTeam.inviteCode}`);
                              toast.success('Invite link copied!');
                            }}
                            className="px-3 py-2 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors"
                            title="Copy link"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Invitations */}
                  {canPerformAction(teamId, 'invite_members') && (
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                        Send Invitations
                      </h3>
                      
                      <form onSubmit={handleSendInvitations} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Email Addresses (comma-separated)
                          </label>
                          <textarea
                            value={inviteEmails}
                            onChange={(e) => setInviteEmails(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 resize-none"
                            placeholder="user1@example.com, user2@example.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Role
                          </label>
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Message (optional)
                          </label>
                          <textarea
                            value={inviteMessage}
                            onChange={(e) => setInviteMessage(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-secondary-500 resize-none"
                            placeholder="Add a personal message to the invitation..."
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={loading.invitations}
                            className="btn-primary"
                          >
                            {loading.invitations ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Sending...
                              </>
                            ) : (
                              'Send Invitations'
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                      Danger Zone
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Archive Team */}
                      {canPerformAction(teamId, 'manage_settings') && (
                        <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-yellow-600 dark:text-yellow-400">
                                {currentTeam.archived ? 'Unarchive Team' : 'Archive Team'}
                              </h4>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                {currentTeam.archived 
                                  ? 'Restore this team and make it active again. All members will regain access.'
                                  : 'Archive this team to hide it from active teams. You can unarchive it later. No data will be lost.'}
                              </p>
                              <button
                                onClick={() => setShowArchiveConfirm(true)}
                                disabled={loading.operations}
                                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading.operations ? (
                                  <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Processing...
                                  </>
                                ) : (
                                  currentTeam.archived ? 'Unarchive Team' : 'Archive Team'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Delete Team */}
                      {canPerformAction(teamId, 'manage_settings') && currentTeam.owner?._id === user?.id && (
                        <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
                            <div className="flex-1">
                              <h4 className="text-lg font-medium text-red-600 dark:text-red-400">
                                Delete Team
                              </h4>
                              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                Once you delete a team, there is no going back. This will permanently delete the team, all its projects, and remove all members.
                              </p>
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={loading.operations}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading.operations ? (
                                  <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete Team'
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Modal>

      {/* Confirm Member Removal */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => handleRemoveMember(memberToRemove?.user._id)}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.user.name} from the team?`}
        confirmText="Remove Member"
        confirmVariant="danger"
      />

      {/* Confirm Team Deletion */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTeam}
        title="Delete Team"
        message={`Are you sure you want to delete "${currentTeam.name}"? This action cannot be undone and will permanently delete all team data.`}
        confirmText="Delete Team"
        confirmVariant="danger"
        requireConfirmation={currentTeam.name}
      />

      {/* Confirm Team Archive/Unarchive */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchiveTeam}
        title={currentTeam?.archived ? 'Unarchive Team' : 'Archive Team'}
        message={
          currentTeam?.archived
            ? `Are you sure you want to unarchive "${currentTeam.name}"? This will restore the team and make it active again.`
            : `Are you sure you want to archive "${currentTeam.name}"? The team will be hidden from active teams but can be restored later.`
        }
        confirmText={currentTeam?.archived ? 'Unarchive Team' : 'Archive Team'}
        confirmVariant={currentTeam?.archived ? 'primary' : 'warning'}
      />
    </>
  );
};

export default TeamSettings;