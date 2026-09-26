import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useTeam } from '../../context/TeamContext';
import { useProject } from '../../context/ProjectContext';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';

const MobileTaskAssignment = ({ 
  isOpen, 
  onClose, 
  taskId, 
  currentAssignee, 
  teamId, 
  projectId,
  onAssign 
}) => {
  const { isMobile } = useMobileDetection();
  const { currentTeam } = useTeam();
  const { currentProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(currentAssignee?._id || null);

  // Get available members
  const availableMembers = React.useMemo(() => {
    let members = [];
    
    if (projectId && currentProject?.members) {
      members = currentProject.members.map(m => m.user);
    } else if (teamId && currentTeam?.members) {
      members = currentTeam.members.map(m => m.user);
    }
    
    return members;
  }, [projectId, teamId, currentProject, currentTeam]);

  // Filter members based on search
  const filteredMembers = React.useMemo(() => {
    if (!searchTerm) return availableMembers;
    
    return availableMembers.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableMembers, searchTerm]);

  const handleAssign = async () => {
    if (onAssign) {
      const member = availableMembers.find(m => m._id === selectedMember);
      await onAssign(taskId, member);
    }
    onClose();
  };

  const handleUnassign = async () => {
    if (onAssign) {
      await onAssign(taskId, null);
    }
    onClose();
  };

  if (!isMobile) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Task"
      size="sm"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Unassign Option */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMember(null)}
          className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selectedMember === null
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-secondary-200 dark:border-secondary-600 hover:border-secondary-300 dark:hover:border-secondary-500'
          }`}
        >
          <div className="w-10 h-10 bg-secondary-200 dark:bg-secondary-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-secondary-500 dark:text-secondary-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              Unassigned
            </p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              No one assigned to this task
            </p>
          </div>
          {selectedMember === null && (
            <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          )}
        </motion.div>

        {/* Member List */}
        <div className="max-h-64 overflow-y-auto space-y-2">
          <AnimatePresence>
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, y: -20 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMember(member._id)}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedMember === member._id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-200 dark:border-secondary-600 hover:border-secondary-300 dark:hover:border-secondary-500'
                }`}
              >
                <Avatar
                  src={member.avatar}
                  name={member.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
                    {member.name}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                    {member.email}
                  </p>
                </div>
                {selectedMember === member._id && (
                  <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredMembers.length === 0 && searchTerm && (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No members found matching "{searchTerm}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Cancel
          </button>
          
          {selectedMember === null ? (
            <button
              onClick={handleUnassign}
              disabled={!currentAssignee}
              className="flex-1 btn-outline"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Unassign
            </button>
          ) : (
            <button
              onClick={handleAssign}
              className="flex-1 btn-primary"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Assign
            </button>
          )}
        </div>

        {/* Current Assignment Info */}
        {currentAssignee && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Avatar
                src={currentAssignee.avatar}
                name={currentAssignee.name}
                size="sm"
              />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Currently assigned to {currentAssignee.name}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {currentAssignee.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MobileTaskAssignment;