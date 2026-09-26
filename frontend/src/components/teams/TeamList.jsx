import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import { useTeam } from '../../context/TeamContext';
import TeamCard from './TeamCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import EmptyState from '../common/EmptyState';
import SearchInput from '../common/SearchInput';
import FilterDropdown from '../common/FilterDropdown';

const TeamList = ({ onTeamSelect, onCreateTeam, showCreateButton = true }) => {
  const {
    teams,
    filteredTeams,
    loading,
    errors,
    filters,
    setFilters,
    fetchTeams
  } = useTeam();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'created', 'members', 'projects'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Teams' },
    { value: 'owner', label: 'Teams I Own' },
    { value: 'member', label: 'Teams I\'m In' },
    { value: 'public', label: 'Public Teams' },
    { value: 'private', label: 'Private Teams' }
  ];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Date Created' },
    { value: 'members', label: 'Member Count' },
    { value: 'projects', label: 'Project Count' }
  ];

  // Fetch teams on mount
  useEffect(() => {
    if (teams.length === 0) {
      fetchTeams();
    }
  }, [teams.length, fetchTeams]);

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
  };

  // Handle filter change
  const handleFilterChange = (filterType) => {
    setFilters({ status: filterType });
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort teams
  const sortedTeams = [...filteredTeams].sort((a, b) => {
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
      case 'members':
        aValue = a.members?.length || 0;
        bValue = b.members?.length || 0;
        break;
      case 'projects':
        aValue = a.projects?.length || 0;
        bValue = b.projects?.length || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading.teams) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (errors.teams) {
    return (
      <ErrorMessage 
        message={errors.teams} 
        onRetry={() => fetchTeams()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Teams
          </h2>
          <p className="text-secondary-600 dark:text-secondary-400 mt-1">
            Manage and collaborate with your teams
          </p>
        </div>
        {showCreateButton && (
          <button
            onClick={onCreateTeam}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Team
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search teams..."
            value={filters.search || ''}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <FilterDropdown
            options={filterOptions}
            value={filters.status || 'all'}
            onChange={handleFilterChange}
            icon={FunnelIcon}
            label="Filter"
          />

          {/* Sort Dropdown */}
          <FilterDropdown
            options={sortOptions}
            value={sortBy}
            onChange={(value) => handleSort(value)}
            label="Sort"
          />

          {/* View Mode Toggle */}
          <div className="flex items-center border border-secondary-300 dark:border-secondary-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
              title="Grid View"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
              }`}
              title="List View"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {filters.search && (
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          {sortedTeams.length} team{sortedTeams.length !== 1 ? 's' : ''} found
          {filters.search && ` for "${filters.search}"`}
        </div>
      )}

      {/* Teams Grid/List */}
      {sortedTeams.length === 0 ? (
        <EmptyState
          icon={PlusIcon}
          title="No teams found"
          description={
            filters.search
              ? "Try adjusting your search or filters"
              : "Create your first team to start collaborating"
          }
          action={
            showCreateButton && !filters.search
              ? {
                  label: "Create Team",
                  onClick: onCreateTeam
                }
              : null
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {sortedTeams.map((team, index) => (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TeamCard
                  team={team}
                  viewMode={viewMode}
                  onClick={() => onTeamSelect?.(team)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Load More (if pagination is implemented) */}
      {sortedTeams.length > 0 && sortedTeams.length % 10 === 0 && (
        <div className="flex justify-center">
          <button className="btn-secondary">
            Load More Teams
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamList;