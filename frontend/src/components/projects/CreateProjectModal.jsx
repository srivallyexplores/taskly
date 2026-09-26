import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useProject } from '../../context/ProjectContext';
import { useTeam } from '../../context/TeamContext';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../common/Modal';
import { Button } from '../ui/Button';

const CreateProjectModal = ({ isOpen, onClose, teamId = null }) => {
  const { createProject } = useProject();
  const { teams, fetchTeams } = useTeam();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    priority: 'medium',
    dueDate: '',
    teamId: teamId || ''
  });
  const [errors, setErrors] = useState({});

  // Fetch teams if no teamId is provided
  useEffect(() => {
    if (isOpen && !teamId && teams.length === 0) {
      fetchTeams();
    }
  }, [isOpen, teamId, teams.length, fetchTeams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Project name must be less than 100 characters';
    }
    
    if (!formData.teamId) {
      newErrors.teamId = 'Please select a team';
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createProject(formData);
      
      if (result.success) {
        showSuccess('Project created successfully');
        onClose();
        setFormData({
          name: '',
          description: '',
          status: 'active',
          priority: 'medium',
          dueDate: '',
          teamId: teamId || ''
        });
      } else {
        showError(result.message || 'Failed to create project');
      }
    } catch (error) {
      showError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={100}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 ${
              errors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
            }`}
            placeholder="Enter project name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Team Selection (only if teamId not provided) */}
        {!teamId && (
          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Team *
            </label>
            <select
              id="teamId"
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 ${
                errors.teamId 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
              }`}
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
            {errors.teamId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teamId}</p>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={1000}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 ${
              errors.description 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
            }`}
            placeholder="Enter project description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
            {formData.description.length}/1000 characters
          </p>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
