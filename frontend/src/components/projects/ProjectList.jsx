import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useProject } from '../../context/ProjectContext';
import { useTeam } from '../../context/TeamContext';
import ProjectCard from './ProjectCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import SearchInput from '../common/SearchInput';
import FilterDropdown from '../common/FilterDropdown';

const ProjectList = ({ teamId, onProjectSelect, onCreateProject, showCreateButton = true }) => {
  const {
    projects,
    filteredProjects,
    loading,
    errors,
    filters,
    setFilters,
    fetchProjects
  } = useProject();

  const { teams } = useTeam();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'created', 'progress', 'dueDate'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Projects are fetched by the page component, not here
  // This component only displays the projects passed as props

  // Filter and sort projects
  const processedProjects = React.useMemo(() => {
    let result = filteredProjects || projects || [];

    // Apply sorting
    result = [...result].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        case 'dueDate':
          aValue = a.endDate ? new Date(a.endDate) : new Date('9999-12-31');
          bValue = b.endDate ? new Date(b.endDate) : new Date('9999-12-31');
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredProjects, projects, sortBy, sortOrder]);

  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({ ...filters, [filterType]: value });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleProjectClick = (project) => {
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    }
  };

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' }
  ];

  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    ...teams.map(team => ({ value: team._id, label: team.name }))
  ];

  if (loading.projects) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errors.projects) {
    return (
      <ErrorMessage 
        message={errors.projects} 
        onRetry={() => fetchProjects(teamId ? { teamId } : {})}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 truncate">
            Projects
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            {teamId ? 'Team projects' : 'All projects'} ({processedProjects.length})
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="w-full sm:w-80">
            <SearchInput
              placeholder="Search projects..."
              value={filters.search || ''}
              onChange={handleSearch}
              icon={MagnifyingGlassIcon}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <FilterDropdown
              label="Status"
              value={filters.status || 'all'}
              options={statusOptions}
              onChange={(value) => handleFilterChange('status', value)}
              icon={FunnelIcon}
            />
            <FilterDropdown
              label="Priority"
              value={filters.priority || 'all'}
              options={priorityOptions}
              onChange={(value) => handleFilterChange('priority', value)}
            />
            {!teamId && (
              <FilterDropdown
                label="Team"
                value={filters.teamId || 'all'}
                options={teamOptions}
                onChange={(value) => handleFilterChange('teamId', value)}
              />
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600'
                : 'text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <ViewColumnsIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600'
                : 'text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700'
            }`}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {processedProjects.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          <AnimatePresence>
            {processedProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProjectCard
                  project={project}
                  onClick={handleProjectClick}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState
          icon={ChartBarIcon}
          title="No projects found"
          description={
            filters.search || filters.status !== 'all' || filters.priority !== 'all'
              ? 'Try adjusting your filters to see more projects.'
              : 'Create your first project to get started.'
          }
          action={showCreateButton ? handleCreateProject : undefined}
          actionLabel={showCreateButton ? 'Create Project' : undefined}
        />
      )}
    </div>
  );
};

export default ProjectList;