import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import ProjectSettings from '../components/projects/ProjectSettings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Button } from '../components/ui';

const ProjectSettingsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    currentProject, 
    loading, 
    errors, 
    fetchProject,
    canPerformAction 
  } = useProject();

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  const handleClose = () => {
    navigate(`/projects/${projectId}`);
  };

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
    return (
      <ErrorMessage 
        message="Project not found" 
        action={{
          label: 'Back to Projects',
          onClick: () => navigate('/projects')
        }}
      />
    );
  }

  if (!canPerformAction(projectId, 'manage_project_settings')) {
    return (
      <ErrorMessage 
        message="You don't have permission to access project settings" 
        action={{
          label: 'Back to Project',
          onClick: handleBack
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back to Project
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Cog6ToothIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                Project Settings
              </h1>
              <p className="text-secondary-600 dark:text-secondary-400">
                Manage {currentProject.name} settings and members
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Project Settings Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ProjectSettings projectId={projectId} onClose={handleClose} />
      </motion.div>
    </div>
  );
};

export default ProjectSettingsPage;