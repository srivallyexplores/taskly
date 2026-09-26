import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import { useNotification } from '../../context/NotificationContext';
import Modal from '../common/Modal';
import { Button } from '../ui/Button';

const CreateTeamModal = ({ isOpen, onClose }) => {
  const { createTeam } = useTeam();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Team name must be less than 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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
      const result = await createTeam(formData);
      
      if (result.success) {
        showSuccess('Team created successfully');
        onClose();
        setFormData({
          name: '',
          description: '',
          isPublic: false
        });
      } else {
        showError(result.message || 'Failed to create team');
      }
    } catch (error) {
      showError('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Team">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Team Name *
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
            placeholder="Enter team name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

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
            maxLength={500}
            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 focus:outline-none focus:ring-2 ${
              errors.description 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'
            }`}
            placeholder="Enter team description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Public Team */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            name="isPublic"
            checked={formData.isPublic}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-secondary-700 dark:text-secondary-300">
            Make this team public (anyone can join with invite code)
          </label>
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
            {loading ? 'Creating...' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTeamModal;
