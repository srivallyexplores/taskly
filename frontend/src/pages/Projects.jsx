import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  FolderIcon,
  UsersIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useNotification } from '../context/NotificationContext';
import ProjectList from '../components/projects/ProjectList';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading, errors, fetchProjects } = useProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (user && !hasFetched) {
      setHasFetched(true);
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleProjectClick = (project) => {
    navigate(`/projects/${project._id}`);
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  if (loading.projects) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Projects
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400">
            Organize and track your projects effectively.
          </p>
        </div>
        <Button 
          onClick={handleCreateProject}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          New Project
        </Button>
      </div>

      {/* Error Message */}
      {errors.projects && (
        <ErrorMessage 
          message={errors.projects} 
          onRetry={fetchProjects}
        />
      )}

      {/* Projects List */}
      {!loading.projects && !errors.projects && (
        <ProjectList 
          projects={projects}
          onProjectSelect={handleProjectClick}
          onCreateProject={handleCreateProject}
        />
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Projects;