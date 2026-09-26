import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  UserPlusIcon,
  EnvelopeIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';

const InviteModal = ({ 
  isOpen, 
  onClose, 
  teamId, 
  projectId, 
  title 
}) => {
  const { 
    currentTeam, 
    generateInviteCode, 
    inviteMembers: inviteTeamMembers,
    loading: teamLoading 
  } = useTeam();
  
  const { 
    currentProject, 
    inviteMembers: inviteProjectMembers,
    loading: projectLoading 
  } = useProject();

  const [inviteMethod, setInviteMethod] = useState('email'); // 'email' or 'link'
  const [inviteCode, setInviteCode] = useState('');
  const [emailInvites, setEmailInvites] = useState([{ email: '', role: 'member' }]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const loading = teamLoading.inviteMembers || projectLoading.inviteMembers;
  const entity = projectId ? currentProject : currentTeam;

  // Generate invite code on mount if using link method
  useEffect(() => {
    if (isOpen && inviteMethod === 'link' && !inviteCode && teamId) {
      handleGenerateInviteCode();
    }
  }, [isOpen, inviteMethod, teamId]);

  // Set existing invite code if available
  useEffect(() => {
    if (entity?.inviteCode) {
      setInviteCode(entity.inviteCode);
    }
  }, [entity]);

  const handleGenerateInviteCode = async () => {
    if (!teamId) return;
    
    setIsGeneratingCode(true);
    try {
      const code = await generateInviteCode(teamId);
      setInviteCode(code);
    } catch (error) {
      //console.error('Failed to generate invite code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleAddEmailField = () => {
    setEmailInvites([...emailInvites, { email: '', role: 'member' }]);
  };

  const handleRemoveEmailField = (index) => {
    if (emailInvites.length > 1) {
      setEmailInvites(emailInvites.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index, field, value) => {
    const updated = emailInvites.map((invite, i) => 
      i === index ? { ...invite, [field]: value } : invite
    );
    setEmailInvites(updated);
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      //console.error('Failed to copy invite link:', error);
    }
  };

  const handleShareInviteLink = () => {
    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    const shareText = `Join ${entity?.name || 'our team'}: ${inviteLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${entity?.name || 'our team'}`,
        text: shareText,
        url: inviteLink
      });
    } else {
      // Fallback to copying
      handleCopyInviteLink();
    }
  };

  const handleSendInvites = async () => {
    const validInvites = emailInvites.filter(invite => 
      invite.email && invite.email.includes('@')
    );

    if (validInvites.length === 0) {
      return;
    }

    try {
      const inviteData = {
        invites: validInvites,
        message: message.trim() || undefined
      };

      if (projectId) {
        await inviteProjectMembers(projectId, inviteData);
      } else if (teamId) {
        await inviteTeamMembers(teamId, inviteData);
      }

      // Reset form and close modal
      setEmailInvites([{ email: '', role: 'member' }]);
      setMessage('');
      onClose();
    } catch (error) {
      //console.error('Failed to send invites:', error);
    }
  };

  const isEmailMethodValid = emailInvites.some(invite => 
    invite.email && invite.email.includes('@')
  );

  const modalTitle = title || (projectId ? 'Invite to Project' : 'Invite to Team');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="lg"
    >
      <div className="space-y-6">
        {/* Invite Method Selection */}
        <div className="flex space-x-4">
          <button
            onClick={() => setInviteMethod('email')}
            className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
              inviteMethod === 'email'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <EnvelopeIcon className="w-5 h-5" />
              <span className="font-medium">Email Invites</span>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
              Send direct email invitations
            </p>
          </button>

          {teamId && (
            <button
              onClick={() => setInviteMethod('link')}
              className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                inviteMethod === 'link'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <LinkIcon className="w-5 h-5" />
                <span className="font-medium">Invite Link</span>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                Share an invite link
              </p>
            </button>
          )}
        </div>

        {/* Email Invites */}
        {inviteMethod === 'email' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Email Addresses
              </label>
              <div className="space-y-3">
                {emailInvites.map((invite, index) => (
                  <div key={index} className="flex space-x-3">
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={invite.email}
                      onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                      className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                    />
                    <select
                      value={invite.role}
                      onChange={(e) => handleEmailChange(index, 'role', e.target.value)}
                      className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      {!projectId && <option value="owner">Owner</option>}
                    </select>
                    {emailInvites.length > 1 && (
                      <button
                        onClick={() => handleRemoveEmailField(index)}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddEmailField}
                className="mt-3 flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add another email
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={3}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              />
            </div>
          </motion.div>
        )}

        {/* Invite Link */}
        {inviteMethod === 'link' && teamId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Invite Link
              </label>
              {inviteCode ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                    <code className="flex-1 text-sm font-mono text-secondary-900 dark:text-secondary-100 break-all">
                      {`${window.location.origin}/join/${inviteCode}`}
                    </code>
                    <button
                      onClick={handleCopyInviteLink}
                      className="p-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
                      title="Copy link"
                    >
                      {copied ? (
                        <CheckIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <DocumentDuplicateIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCopyInviteLink}
                      className="flex-1 btn-secondary"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      onClick={handleShareInviteLink}
                      className="flex-1 btn-secondary"
                    >
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </button>
                  </div>

                  <button
                    onClick={handleGenerateInviteCode}
                    disabled={isGeneratingCode}
                    className="w-full btn-outline"
                  >
                    {isGeneratingCode ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <LinkIcon className="w-4 h-4 mr-2" />
                    )}
                    Generate New Link
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={handleGenerateInviteCode}
                    disabled={isGeneratingCode}
                    className="btn-primary"
                  >
                    {isGeneratingCode ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <LinkIcon className="w-4 h-4 mr-2" />
                    )}
                    Generate Invite Link
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                About Invite Links
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Anyone with this link can join the team</li>
                <li>• New members will have the "member" role by default</li>
                <li>• You can generate a new link to invalidate the old one</li>
                <li>• Links don't expire but can be disabled in team settings</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          
          {inviteMethod === 'email' && (
            <button
              onClick={handleSendInvites}
              disabled={!isEmailMethodValid || loading}
              className="btn-primary"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <UserPlusIcon className="w-4 h-4 mr-2" />
              )}
              Send Invites ({emailInvites.filter(i => i.email && i.email.includes('@')).length})
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default InviteModal;