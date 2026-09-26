import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import ProjectDashboard from '../components/projects/ProjectDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { Button } from '../components/ui';

const ProjectDashboardPage = () => {
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
  
  const fetchedRef = useRef(null);

  useEffect(() => {
    if (projectId && fetchedRef.current !== projectId && (!currentProject || currentProject._id !== projectId)) {
      fetchedRef.current = projectId;
      fetchProject(projectId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleCreateTask = () => {
    navigate(`/projects/${projectId}/tasks/new`);
  };

  const handleProjectSettings = () => {
    navigate(`/projects/${projectId}/settings`);
  };

  const handleProjectAnalytics = () => {
    navigate(`/projects/${projectId}/analytics`);
  };

  const handleViewTasks = () => {
    navigate(`/projects/${projectId}/tasks`);
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FolderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
              {currentProject.name}
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">
              {currentProject.description || 'Project Dashboard'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {canPerformAction(projectId, 'create_tasks') ? (
            <Button
              onClick={handleCreateTask}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              New Task
            </Button>
          ) : (
            <Button
              disabled
              leftIcon={<PlusIcon className="w-4 h-4" />}
              title="You don't have permission to create tasks"
            >
              New Task
            </Button>
          )}
          
          <Button
            variant="secondary"
            onClick={handleViewTasks}
            leftIcon={<CheckIcon className="w-4 h-4" />}
          >
            View Tasks
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleProjectAnalytics}
            leftIcon={<ChartBarIcon className="w-4 h-4" />}
          >
            Analytics
          </Button>

          {canPerformAction(projectId, 'manage_project_settings') ? (
            <Button
              variant="secondary"
              onClick={handleProjectSettings}
              leftIcon={<Cog6ToothIcon className="w-4 h-4" />}
            >
              Settings
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled
              leftIcon={<Cog6ToothIcon className="w-4 h-4" />}
              title="You don't have permission to manage project settings"
            >
              Settings
            </Button>
          )}
        </div>
      </motion.div>

      {/* Project Dashboard Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ProjectDashboard projectId={projectId} />
      </motion.div>
    </div>
  );
};

export default ProjectDashboardPage;