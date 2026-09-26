import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  UserPlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  FlagIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useProject } from '../../context/ProjectContext';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import { format } from 'date-fns';

const ProjectSettings = ({ projectId, onClose }) => {
  const { user } = useAuth();
  const {
    currentProject,
    loading,
    errors,
    updateProject,
    deleteProject,
    archiveProject,
    addProjectMember,
    removeProjectMember,
    updateProjectMemberRole,
    canPerformAction,
    fetchProject
  } = useProject();

  const { teams, fetchTeams } = useTeam();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'planning',
    budget: '',
    teamId: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  // Initialize form data when project loads
  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name || '',
        description: currentProject.description || '',
        startDate: currentProject.startDate ? format(new Date(currentProject.startDate), 'yyyy-MM-dd') : '',
        endDate: currentProject.endDate ? format(new Date(currentProject.endDate), 'yyyy-MM-dd') : '',
        priority: currentProject.priority || 'medium',
        status: currentProject.status || 'planning',
        budget: currentProject.budget || '',
        teamId: currentProject.team?._id || ''
      });
    }
  }, [currentProject]);

  // Fetch project and teams on mount (only if not already loaded)
  useEffect(() => {
    if (projectId && (!currentProject || currentProject._id !== projectId)) {
      //console.log('⚙️ [ProjectSettings] Fetching project');
      fetchProject(projectId);
    }
    if (teams.length === 0) {
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProject = async () => {
    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        priority: formData.priority,
        status: formData.status,
        budget: formData.budget ? parseFloat(formData.budget) : null
      };
      
      // Don't send teamId in update (it can't be changed)
      await updateProject(projectId, updateData);
    } catch (error) {
      //console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId);
      setShowDeleteModal(false);
      if (onClose) onClose();
    } catch (error) {
      //console.error('Failed to delete project:', error);
    }
  };

  const handleArchiveProject = async () => {
    try {
      await archiveProject(projectId);
      setShowArchiveModal(false);
    } catch (error) {
      //console.error('Failed to archive project:', error);
    }
  };

  const handleAddMember = async () => {
    try {
      await addProjectMember(projectId, {
        email: newMemberEmail,
        role: newMemberRole
      });
      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddMemberModal(false);
    } catch (error) {
      //console.error('Failed to add member:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeProjectMember(projectId, memberId);
    } catch (error) {
      //console.error('Failed to remove member:', error);
    }
  };

  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      await updateProjectMemberRole(projectId, memberId, newRole);
    } catch (error) {
      //console.error('Failed to update member role:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-secondary-600 dark:text-secondary-400';
    }
  };

  const canEdit = canPerformAction(projectId, 'edit_project');
  const canManageMembers = canPerformAction(projectId, 'manage_members');
  const canDelete = canPerformAction(projectId, 'delete_project');

  if (loading.currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errors.currentProject) {
    return (
      <ErrorMessage 
        message={errors.currentProject} 
        onRetry={() => fetchProject(projectId)}
      />
    );
  }

  if (!currentProject) {
    return <ErrorMessage message="Project not found" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
              Project Settings
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Manage project configuration and members
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Close
          </button>
        )}
      </div>

      {/* Project Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6"
      >
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
          Project Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Team
            </label>
            <select
              name="teamId"
              value={formData.teamId}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            >
              <option value="">No Team</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={!canEdit}
              rows={3}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Budget
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              disabled={!canEdit}
              placeholder="0.00"
              step="0.01"
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 disabled:opacity-50"
            />
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProject}
              disabled={loading.updateProject}
              className="btn-primary"
            >
              {loading.updateProject ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </motion.div>

      {/* Project Members */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            Project Members ({currentProject.members?.length || 0})
          </h2>
          {canManageMembers && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn-secondary"
            >
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add Member
            </button>
          )}
        </div>

        <div className="space-y-3">
          {currentProject.members?.filter(member => member.user).map((member) => (
            <div
              key={member.user._id || member.user.id}
              className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar
                  src={member.user?.avatar}
                  name={member.user?.name || 'Unknown'}
                  size="md"
                />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-secondary-100">
                    {member.user?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    {member.user?.email || 'No email'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {canManageMembers ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleUpdateMemberRole(member.user?._id || member.user?.id, e.target.value)}
                    className="text-sm border border-secondary-300 dark:border-secondary-600 rounded-md px-2 py-1 bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100"
                  >
                    <option value="manager">Manager</option>
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <Badge variant="secondary" size="sm">
                    {member.role}
                  </Badge>
                )}
                {canManageMembers && (member.user?._id || member.user?.id) !== (user?._id || user?.id) && (
                  <button
                    onClick={() => handleRemoveMember(member.user?._id || member.user?.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger Zone */}
      {(canDelete || canEdit) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-6"
        >
          <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            {canEdit && currentProject.status !== 'archived' && (
              <div className="flex items-center justify-between p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                    Archive Project
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Archive this project to hide it from active projects
                  </p>
                </div>
                <button
                  onClick={() => setShowArchiveModal(true)}
                  className="btn-warning"
                >
                  <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                  Archive
                </button>
              </div>
            )}

            {canDelete && (
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-secondary-900 dark:text-secondary-100">
                    Delete Project
                  </h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Permanently delete this project and all its data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Project Member"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Role
            </label>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              disabled={!newMemberEmail || loading.addMember}
              className="btn-primary"
            >
              {loading.addMember ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <UserPlusIcon className="w-4 h-4 mr-2" />
              )}
              Add Member
            </button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        title="Archive Project"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-secondary-900 dark:text-secondary-100">
                Are you sure you want to archive this project?
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                The project will be hidden from active projects but can be restored later.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowArchiveModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleArchiveProject}
              disabled={loading.archiveProject}
              className="btn-warning"
            >
              {loading.archiveProject ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <ArchiveBoxIcon className="w-4 h-4 mr-2" />
              )}
              Archive Project
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-secondary-900 dark:text-secondary-100">
                Are you sure you want to delete this project?
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                This action cannot be undone. All project data will be permanently deleted.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteProject}
              disabled={loading.deleteProject}
              className="btn-danger"
            >
              {loading.deleteProject ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <TrashIcon className="w-4 h-4 mr-2" />
              )}
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectSettings;