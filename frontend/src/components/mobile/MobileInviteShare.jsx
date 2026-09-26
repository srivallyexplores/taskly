import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShareIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTeam } from '../../context/TeamContext';
import Modal from '../common/Modal';
import QRCode from 'qrcode.react';

const MobileInviteShare = ({ 
  isOpen, 
  onClose, 
  teamId, 
  inviteCode 
}) => {
  const { isMobile, touchDevice } = useMobileDetection();
  const { currentTeam } = useTeam();
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState('link');

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;
  const shareText = `Join ${currentTeam?.name || 'our team'} on Taskly!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: `${shareText}\n\n${inviteLink}`,
          url: inviteLink
        });
      } catch (error) {
        //console.log('Share cancelled or failed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSMSShare = () => {
    const smsText = encodeURIComponent(`${shareText}\n\n${inviteLink}`);
    window.open(`sms:?body=${smsText}`);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join ${currentTeam?.name || 'our team'} on Taskly`);
    const body = encodeURIComponent(`Hi!\n\nYou've been invited to join ${currentTeam?.name || 'our team'} on Taskly.\n\nClick the link below to join:\n${inviteLink}\n\nLooking forward to collaborating with you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareOptions = [
    {
      id: 'native',
      label: 'Share',
      icon: ShareIcon,
      action: handleNativeShare,
      show: navigator.share && isMobile,
      primary: true
    },
    {
      id: 'copy',
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? CheckIcon : DocumentDuplicateIcon,
      action: handleCopyLink,
      show: true,
      primary: !navigator.share || !isMobile
    },
    {
      id: 'sms',
      label: 'Text Message',
      icon: DevicePhoneMobileIcon,
      action: handleSMSShare,
      show: isMobile
    },
    {
      id: 'email',
      label: 'Email',
      icon: EnvelopeIcon,
      action: handleEmailShare,
      show: true
    }
  ].filter(option => option.show);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Members"
      size="sm"
    >
      <div className="space-y-6">
        {/* Share Method Toggle */}
        <div className="flex space-x-2 bg-secondary-100 dark:bg-secondary-700 rounded-lg p-1">
          <button
            onClick={() => setShareMethod('link')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              shareMethod === 'link'
                ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                : 'text-secondary-600 dark:text-secondary-400'
            }`}
          >
            Share Link
          </button>
          <button
            onClick={() => setShareMethod('qr')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              shareMethod === 'qr'
                ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                : 'text-secondary-600 dark:text-secondary-400'
            }`}
          >
            QR Code
          </button>
        </div>

        {/* Share Link Method */}
        {shareMethod === 'link' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Invite Link Display */}
            <div className="p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                Invite Link
              </p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs font-mono text-secondary-700 dark:text-secondary-300 break-all bg-white dark:bg-secondary-600 p-2 rounded">
                  {inviteLink}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="p-2 text-secondary-600 hover:text-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-100"
                >
                  {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={option.action}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-colors ${
                    option.primary
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-secondary-200 dark:border-secondary-600 hover:border-secondary-300 dark:hover:border-secondary-500 text-secondary-700 dark:text-secondary-300'
                  }`}
                >
                  <option.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* QR Code Method */}
        {shareMethod === 'qr' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <QRCode
                  value={inviteLink}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-3">
                Scan this QR code to join the team
              </p>
            </div>

            {/* QR Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 btn-secondary"
              >
                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 btn-primary"
                >
                  <ShareIcon className="w-4 h-4 mr-2" />
                  Share
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Team Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            About This Invitation
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• New members will join as team members</li>
            <li>• They can participate in projects and tasks</li>
            <li>• Invite links don't expire but can be regenerated</li>
            <li>• You can manage member roles in team settings</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default MobileInviteShare;